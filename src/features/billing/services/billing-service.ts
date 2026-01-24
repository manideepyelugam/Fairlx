import "server-only";

import { ID, Query, Databases } from "node-appwrite";

import {
    DATABASE_ID,
    BILLING_ACCOUNTS_ID,
    BILLING_AUDIT_LOGS_ID,
    INVOICES_ID,
    USAGE_AGGREGATIONS_ID,
    BILLING_CURRENCY,
    USAGE_RATE_TRAFFIC_GB,
    USAGE_RATE_STORAGE_GB_MONTH,
    USAGE_RATE_COMPUTE_UNIT,
} from "@/config";
import { createAdminClient } from "@/lib/appwrite";

import {
    BillingStatus,
    BillingAccountType,
    MandateStatus,
    BillingAccount,
    BillingInvoice,
    BillingAuditEventType,
    InvoiceStatus,
    UsageBreakdown,
} from "../types";

/**
 * Billing Service
 * 
 * Core business logic for the billing system:
 * - Usage aggregation across billing periods
 * - Invoice generation
 * - Auto-debit execution
 * - Grace period enforcement
 * - Account suspension/restoration
 * 
 * CRITICAL: These functions should be called by scheduled jobs (cron)
 */

// ============================================================================
// USAGE AGGREGATION
// ============================================================================

/**
 * Get usage aggregations for a billing account during a billing period
 * 
 * @param billingAccount - The billing account to aggregate usage for
 * @returns Usage breakdown with quantities and costs
 */
export async function aggregateUsageForBillingPeriod(
    databases: Databases,
    billingAccount: BillingAccount
): Promise<UsageBreakdown> {
    const entityId = billingAccount.type === BillingAccountType.ORG
        ? billingAccount.organizationId
        : billingAccount.userId;

    const entityType = billingAccount.type === BillingAccountType.ORG
        ? "organization"
        : "user";

    // Query usage aggregations for this billing period
    const aggregations = await databases.listDocuments(
        DATABASE_ID,
        USAGE_AGGREGATIONS_ID,
        [
            Query.equal("billingEntityId", entityId!),
            Query.equal("billingEntityType", entityType),
            Query.greaterThanEqual("periodStart", billingAccount.billingCycleStart),
            Query.lessThanEqual("periodEnd", billingAccount.billingCycleEnd),
            Query.limit(100),
        ]
    );

    // Initialize usage breakdown matching the UsageBreakdown type
    const breakdown: UsageBreakdown = {
        trafficGB: 0,
        storageAvgGB: 0,
        computeUnits: 0,
        byModule: {},
        costs: {
            traffic: 0,
            storage: 0,
            compute: 0,
            total: 0,
        },
    };

    // Aggregate by resource type
    for (const agg of aggregations.documents) {
        const resourceType = agg.resourceType as string;

        switch (resourceType) {
            case "traffic":
            case "bandwidth":
                // Convert bytes to GB
                const trafficGB = (agg.totalUnits || 0) / (1024 * 1024 * 1024);
                breakdown.trafficGB += trafficGB;
                breakdown.byModule.traffic = (breakdown.byModule.traffic || 0) + trafficGB;
                break;

            case "storage":
                // Convert bytes to GB
                const storageGB = (agg.totalUnits || 0) / (1024 * 1024 * 1024);
                breakdown.storageAvgGB += storageGB;
                breakdown.byModule.storage = (breakdown.byModule.storage || 0) + storageGB;
                break;

            case "compute":
                breakdown.computeUnits += agg.totalUnits || 0;
                breakdown.byModule.compute = (breakdown.byModule.compute || 0) + (agg.totalUnits || 0);
                break;

            case "docs":
                breakdown.byModule.docs = (breakdown.byModule.docs || 0) + (agg.totalUnits || 0);
                break;

            case "github":
                breakdown.byModule.github = (breakdown.byModule.github || 0) + (agg.totalUnits || 0);
                break;

            case "ai":
            case "ai_inference":
            case "ai_training":
                breakdown.byModule.ai = (breakdown.byModule.ai || 0) + (agg.totalUnits || 0);
                break;
        }
    }

    // Calculate costs
    breakdown.costs.traffic = Number((breakdown.trafficGB * USAGE_RATE_TRAFFIC_GB).toFixed(2));
    breakdown.costs.storage = Number((breakdown.storageAvgGB * USAGE_RATE_STORAGE_GB_MONTH).toFixed(2));
    breakdown.costs.compute = Number((breakdown.computeUnits * USAGE_RATE_COMPUTE_UNIT).toFixed(2));
    breakdown.costs.total = Number((
        breakdown.costs.traffic +
        breakdown.costs.storage +
        breakdown.costs.compute
    ).toFixed(2));

    return breakdown;
}

/**
 * Calculate total cost from usage breakdown
 */
export function calculateTotalCost(breakdown: UsageBreakdown): number {
    return breakdown.costs.total;
}

// ============================================================================
// INVOICE GENERATION
// ============================================================================

/**
 * Generate invoice ID with pattern INV-YYYYMM-XXXXXX
 */
function generateInvoiceId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${year}${month}-${random}`;
}

/**
 * Generate an invoice for a billing account
 * 
 * This aggregates usage for the billing period and creates an invoice document.
 * 
 * PRODUCTION HARDENING: Idempotent invoice generation
 * - Uses billing cycle dates as idempotency key
 * - Returns existing invoice if already generated for this cycle
 * - Prevents duplicate charges
 * 
 * @param billingAccountId - The billing account to generate invoice for
 * @returns The created invoice
 */
export async function generateInvoice(
    billingAccountId: string
): Promise<BillingInvoice> {
    const { databases } = await createAdminClient();
    const { isEventProcessed, markEventProcessed } = await import("@/lib/processed-events-registry");

    // Get billing account
    const billingAccount = await databases.getDocument<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId
    );

    // IDEMPOTENCY CHECK: Generate key from billing cycle dates
    const invoiceIdempotencyKey = `invoice:${billingAccountId}:${billingAccount.billingCycleStart}:${billingAccount.billingCycleEnd}`;

    // Check if invoice already generated for this cycle
    if (await isEventProcessed(databases, invoiceIdempotencyKey, "invoice")) {
        console.log(`[Billing] Invoice already exists for cycle ${billingAccount.billingCycleStart} to ${billingAccount.billingCycleEnd}`);

        // Return existing invoice
        const existingInvoices = await databases.listDocuments<BillingInvoice>(
            DATABASE_ID,
            INVOICES_ID,
            [
                Query.equal("billingAccountId", billingAccountId),
                Query.equal("periodStart", billingAccount.billingCycleStart),
                Query.equal("periodEnd", billingAccount.billingCycleEnd),
                Query.limit(1),
            ]
        );

        if (existingInvoices.total > 0) {
            return existingInvoices.documents[0];
        }
        // Fall through if invoice record not found (edge case)
    }

    // Aggregate usage
    const usageBreakdown = await aggregateUsageForBillingPeriod(databases, billingAccount);
    const totalCost = calculateTotalCost(usageBreakdown);

    // Calculate due date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Create invoice
    const invoiceId = generateInvoiceId();
    const invoice = await databases.createDocument<BillingInvoice>(
        DATABASE_ID,
        INVOICES_ID,
        ID.unique(),
        {
            invoiceId,
            billingAccountId,
            billingEntityId: billingAccount.type === BillingAccountType.ORG
                ? billingAccount.organizationId
                : billingAccount.userId,
            billingEntityType: billingAccount.type === BillingAccountType.ORG
                ? "organization"
                : "user",
            periodStart: billingAccount.billingCycleStart,
            periodEnd: billingAccount.billingCycleEnd,
            totalCost,
            usageBreakdown: JSON.stringify(usageBreakdown),
            currency: BILLING_CURRENCY,
            status: InvoiceStatus.DUE,
            dueDate: dueDate.toISOString(),
            createdAt: new Date().toISOString(),
            retryCount: 0,
        }
    );

    // Mark as processed for idempotency
    await markEventProcessed(databases, invoiceIdempotencyKey, "invoice", {
        invoiceId: invoice.$id,
        invoiceNumber: invoiceId,
        amount: totalCost,
    });

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.INVOICE_GENERATED,
            invoiceId: invoice.$id,
            metadata: JSON.stringify({
                invoiceId,
                amount: totalCost,
                currency: BILLING_CURRENCY,
                periodStart: billingAccount.billingCycleStart,
                periodEnd: billingAccount.billingCycleEnd,
            }),
        }
    );

    console.log(`[Billing] Generated invoice ${invoiceId} for ${totalCost} ${BILLING_CURRENCY}`);

    return invoice;
}

// ============================================================================
// BILLING CYCLE PROCESSING
// ============================================================================

/**
 * Process billing cycle for all active accounts
 * 
 * E-MANDATE POSTPAID BILLING FLOW:
 * 1. Find all accounts where billing cycle has ended
 * 2. Generate invoices for each (INVOICE FIRST - no charge yet)
 * 3. Advance billing cycle dates
 * 4. Attempt auto-debit using saved mandate token
 * 
 * This should be called by a scheduled job at the end of each billing period.
 */
export async function processBillingCycle(): Promise<{
    processed: number;
    invoices: string[];
    paymentsAttempted: number;
    paymentsFailed: number;
    errors: string[];
}> {
    const { databases } = await createAdminClient();
    const now = new Date().toISOString();

    // Find accounts where billing cycle has ended
    const accounts = await databases.listDocuments<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        [
            Query.lessThanEqual("billingCycleEnd", now),
            Query.equal("billingStatus", [BillingStatus.ACTIVE, BillingStatus.DUE]),
            Query.limit(100), // Process in batches
        ]
    );

    const results = {
        processed: 0,
        invoices: [] as string[],
        paymentsAttempted: 0,
        paymentsFailed: 0,
        errors: [] as string[],
    };

    for (const account of accounts.documents) {
        try {
            // 0. LOCK THE BILLING CYCLE FIRST
            // CRITICAL: This prevents late usage events from modifying this period
            const { lockBillingCycle, unlockBillingCycle } = await import("@/lib/billing-primitives");
            await lockBillingCycle(databases, account.$id);

            // 1. GENERATE INVOICE FIRST (postpaid billing - invoice before charge)
            const invoice = await generateInvoice(account.$id);
            results.invoices.push(invoice.invoiceId);

            // 2. Advance billing cycle
            const newCycleStart = new Date(account.billingCycleEnd);
            newCycleStart.setDate(newCycleStart.getDate() + 1);

            const newCycleEnd = new Date(newCycleStart.getFullYear(), newCycleStart.getMonth() + 1, 0, 23, 59, 59, 999);

            await databases.updateDocument(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                account.$id,
                {
                    billingCycleStart: newCycleStart.toISOString(),
                    billingCycleEnd: newCycleEnd.toISOString(),
                }
            );

            // 3. UNLOCK for new cycle (new usage can now be recorded)
            await unlockBillingCycle(databases, account.$id);

            // 4. ATTEMPT AUTO-DEBIT using mandate (if authorized and eMandate is enabled)
            // Import feature flag to check if eMandate is enabled
            const { ENABLE_EMANDATE } = await import("@/config");

            // Check if mandate is valid for auto-debit:
            // - Must have token ID
            // - Must be AUTHORIZED status (not SUSPENDED, FAILED, CANCELLED)
            // - eMandate must be enabled OR payment method is UPI/Card (not netbanking)
            const isMandateAuthorized = account.razorpayTokenId &&
                account.mandateStatus === MandateStatus.AUTHORIZED;
            const isNetbankingMandate = account.paymentMethodType === "netbanking" ||
                account.paymentMethodType === "emandate";
            const canAutoDebit = isMandateAuthorized &&
                (ENABLE_EMANDATE || !isNetbankingMandate);

            if (canAutoDebit) {
                try {
                    results.paymentsAttempted++;

                    // Import dynamically to avoid circular dependencies
                    const { createRecurringPayment } = await import("@/lib/razorpay");

                    await createRecurringPayment({
                        customerId: account.razorpayCustomerId,
                        tokenId: account.razorpayTokenId!,
                        amount: invoice.amount,
                        invoiceId: invoice.invoiceId,
                        description: `Fairlx Invoice ${invoice.invoiceId}`,
                        notes: {
                            fairlx_billing_account_id: account.$id,
                            fairlx_invoice_id: invoice.invoiceId,
                        },
                    });

                    console.log(`[Billing] Auto-debit initiated for invoice ${invoice.invoiceId}`);
                } catch (paymentError) {
                    results.paymentsFailed++;
                    console.error(`[Billing] Auto-debit failed for account ${account.$id}:`, paymentError);

                    // Start grace period on payment failure
                    await startGracePeriod(databases, account.$id);
                }
            } else if (account.mandateStatus === MandateStatus.SUSPENDED) {
                // Mandate is suspended - log and start grace period
                console.log(`[Billing] Mandate SUSPENDED for account ${account.$id} (${account.mandateSuspendedReason || "no reason"}), skipping auto-debit`);
                await startGracePeriod(databases, account.$id);
            } else if (!ENABLE_EMANDATE && isNetbankingMandate) {
                // eMandate disabled and this is a netbanking mandate - log and start grace period
                console.log(`[Billing] eMandate disabled for account ${account.$id} (netbanking mandate), skipping auto-debit`);

                // Log audit event for eMandate suspension
                await databases.createDocument(
                    DATABASE_ID,
                    BILLING_AUDIT_LOGS_ID,
                    ID.unique(),
                    {
                        billingAccountId: account.$id,
                        eventType: BillingAuditEventType.EMANDATE_SUSPENDED,
                        metadata: JSON.stringify({
                            reason: "ENABLE_EMANDATE feature flag is disabled",
                            paymentMethodType: account.paymentMethodType,
                            mandateStatus: account.mandateStatus,
                            timestamp: new Date().toISOString(),
                        }),
                    }
                );

                await startGracePeriod(databases, account.$id);
            } else {
                // No mandate authorized - start grace period immediately
                console.log(`[Billing] No mandate for account ${account.$id}, starting grace period`);
                await startGracePeriod(databases, account.$id);
            }

            results.processed++;
        } catch (error) {
            console.error(`[Billing] Failed to process account ${account.$id}:`, error);
            results.errors.push(`${account.$id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    console.log(`[Billing] Processed ${results.processed} accounts, generated ${results.invoices.length} invoices, ${results.paymentsAttempted} payments attempted, ${results.paymentsFailed} failed`);

    return results;
}

/**
 * Start grace period for a billing account
 */
async function startGracePeriod(databases: Databases, billingAccountId: string): Promise<void> {
    const GRACE_PERIOD_DAYS = 14;
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId,
        {
            billingStatus: BillingStatus.DUE,
            gracePeriodEnd: gracePeriodEnd.toISOString(),
            lastPaymentFailedAt: new Date().toISOString(),
        }
    );

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.GRACE_PERIOD_STARTED,
            metadata: JSON.stringify({
                gracePeriodEnd: gracePeriodEnd.toISOString(),
                daysRemaining: GRACE_PERIOD_DAYS,
            }),
        }
    );
}

// ============================================================================
// GRACE PERIOD ENFORCEMENT
// ============================================================================

/**
 * Check and enforce grace periods
 * 
 * This should be called by a scheduled job daily.
 * 
 * Steps:
 * 1. Find accounts in DUE status with expired grace period
 * 2. Suspend those accounts
 */
export async function enforceGracePeriods(): Promise<{
    checked: number;
    suspended: string[];
}> {
    const { databases } = await createAdminClient();
    const now = new Date().toISOString();

    // Find DUE accounts with expired grace period
    const accounts = await databases.listDocuments<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        [
            Query.equal("billingStatus", BillingStatus.DUE),
            Query.lessThanEqual("gracePeriodEnd", now),
            Query.limit(100),
        ]
    );

    const results = {
        checked: accounts.total,
        suspended: [] as string[],
    };

    for (const account of accounts.documents) {
        try {
            await suspendAccount(account.$id, "Grace period expired");
            results.suspended.push(account.$id);
        } catch (error) {
            console.error(`[Billing] Failed to suspend account ${account.$id}:`, error);
        }
    }

    console.log(`[Billing] Grace period check: ${results.checked} accounts, ${results.suspended.length} suspended`);

    return results;
}

// ============================================================================
// ACCOUNT SUSPENSION & RESTORATION
// ============================================================================

/**
 * Suspend a billing account
 * 
 * This sets the account status to SUSPENDED and logs the event.
 * The account will be blocked from most operations by the billing guard.
 */
export async function suspendAccount(
    billingAccountId: string,
    reason: string = "Payment failed"
): Promise<void> {
    const { databases } = await createAdminClient();

    // Update status
    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId,
        { billingStatus: BillingStatus.SUSPENDED }
    );

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.ACCOUNT_SUSPENDED,
            metadata: JSON.stringify({ reason }),
        }
    );

    console.log(`[Billing] Suspended account ${billingAccountId}: ${reason}`);
}

/**
 * Restore a suspended billing account
 * 
 * This sets the account status back to ACTIVE and clears the grace period.
 * Should be called after successful payment.
 */
export async function restoreAccount(
    billingAccountId: string,
    reason: string = "Payment received"
): Promise<void> {
    const { databases } = await createAdminClient();

    // Get current status for logging
    const account = await databases.getDocument<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId
    );

    const previousStatus = account.billingStatus;

    // Update status
    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId,
        {
            billingStatus: BillingStatus.ACTIVE,
            gracePeriodEnd: null,
            lastPaymentAt: new Date().toISOString(),
        }
    );

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.ACCOUNT_RESTORED,
            metadata: JSON.stringify({
                reason,
                previousStatus,
            }),
        }
    );

    console.log(`[Billing] Restored account ${billingAccountId}: ${reason}`);
}

// ============================================================================
// BILLING ACCOUNT SETUP
// ============================================================================

/**
 * Setup billing for a new organization
 * 
 * Creates a billing account linked to the organization.
 * Should be called when an organization is created or converted to.
 */
export async function setupOrganizationBilling(
    organizationId: string,
    options: {
        billingEmail?: string;
        razorpayCustomerId?: string;
    } = {}
): Promise<BillingAccount> {
    const { databases } = await createAdminClient();

    // Check if billing account already exists
    const existing = await databases.listDocuments<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        [
            Query.equal("organizationId", organizationId),
            Query.equal("type", BillingAccountType.ORG),
            Query.limit(1),
        ]
    );

    if (existing.total > 0) {
        return existing.documents[0];
    }

    // Calculate initial billing cycle
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Create billing account
    const billingAccount = await databases.createDocument<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        ID.unique(),
        {
            type: BillingAccountType.ORG,
            organizationId,
            userId: null,
            razorpayCustomerId: options.razorpayCustomerId || null,
            billingStatus: BillingStatus.ACTIVE,
            billingCycleStart: cycleStart.toISOString(),
            billingCycleEnd: cycleEnd.toISOString(),
            billingEmail: options.billingEmail || null,
        }
    );

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: billingAccount.$id,
            eventType: BillingAuditEventType.BILLING_ACCOUNT_CREATED,
            metadata: JSON.stringify({
                type: BillingAccountType.ORG,
                organizationId,
            }),
        }
    );

    console.log(`[Billing] Created billing account for organization ${organizationId}`);

    return billingAccount;
}

/**
 * Setup billing for a personal account
 */
export async function setupPersonalBilling(
    userId: string,
    options: {
        billingEmail?: string;
        razorpayCustomerId?: string;
    } = {}
): Promise<BillingAccount> {
    const { databases } = await createAdminClient();

    // Check if billing account already exists
    const existing = await databases.listDocuments<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        [
            Query.equal("userId", userId),
            Query.equal("type", BillingAccountType.PERSONAL),
            Query.limit(1),
        ]
    );

    if (existing.total > 0) {
        return existing.documents[0];
    }

    // Calculate initial billing cycle
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Create billing account
    const billingAccount = await databases.createDocument<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        ID.unique(),
        {
            type: BillingAccountType.PERSONAL,
            userId,
            organizationId: null,
            razorpayCustomerId: options.razorpayCustomerId || null,
            billingStatus: BillingStatus.ACTIVE,
            billingCycleStart: cycleStart.toISOString(),
            billingCycleEnd: cycleEnd.toISOString(),
            billingEmail: options.billingEmail || null,
        }
    );

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: billingAccount.$id,
            eventType: BillingAuditEventType.BILLING_ACCOUNT_CREATED,
            metadata: JSON.stringify({
                type: BillingAccountType.PERSONAL,
                userId,
            }),
        }
    );

    console.log(`[Billing] Created billing account for user ${userId}`);

    return billingAccount;
}
