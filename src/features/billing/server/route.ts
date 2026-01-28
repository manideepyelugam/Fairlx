import "server-only";

import { Hono } from "hono";
import { ID, Query, Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import {
    DATABASE_ID,
    BILLING_ACCOUNTS_ID,
    BILLING_AUDIT_LOGS_ID,
    INVOICES_ID,
    BILLING_CURRENCY,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import {
    createCustomer,
    createMandateAuthorizationOrder,
    getPublicKey,
    ensureCustomerContact,
} from "@/lib/razorpay";

import {
    BillingStatus,
    BillingAccountType,
    MandateStatus,
    BillingAccount,
    BillingInvoice,
    BillingAuditEventType,
    InvoiceStatus,
} from "../types";

import {
    setupBillingSchema,
    getBillingAccountSchema,
    checkoutOptionsSchema,
    updatePaymentMethodSchema,
    getInvoicesSchema,
    retryPaymentSchema,
} from "../schemas";

/**
 * Billing API Routes
 * 
 * Handles billing account management, payment methods, and invoice operations.
 * 
 * CRITICAL ROUTES:
 * - GET /billing/account - Get billing account status
 * - POST /billing/setup - Create billing account with Razorpay
 * - POST /billing/payment-method - Update payment method after checkout
 * - GET /billing/invoices - List invoices
 * - POST /billing/retry-payment - Retry failed payment
 * - GET /billing/checkout-options - Get Razorpay checkout options
 */

// Helper: Log billing audit event
async function logBillingAudit(
    databases: Databases,
    billingAccountId: string,
    eventType: BillingAuditEventType,
    options: {
        actorUserId?: string;
        metadata?: Record<string, unknown>;
        invoiceId?: string;
        razorpayEventId?: string;
        ipAddress?: string;
    } = {}
) {
    try {
        await databases.createDocument(
            DATABASE_ID,
            BILLING_AUDIT_LOGS_ID,
            ID.unique(),
            {
                billingAccountId,
                eventType,
                metadata: options.metadata ? JSON.stringify(options.metadata) : null,
                actorUserId: options.actorUserId || null,
                invoiceId: options.invoiceId || null,
                razorpayEventId: options.razorpayEventId || null,
                ipAddress: options.ipAddress || null,
            }
        );
    } catch {
        // Don't throw - audit failures shouldn't block operations
    }
}

// Helper: Calculate next billing cycle dates
function calculateBillingCycle(startDate?: Date): { start: string; end: string } {
    const now = startDate || new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

// Helper: Generate invoice ID (for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateInvoiceId(prefix: string = "INV"): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
}

const app = new Hono()
    /**
     * GET /billing/account
     * Get billing account for current user or organization
     */
    .get(
        "/account",
        sessionMiddleware,
        zValidator("query", getBillingAccountSchema),
        async (c) => {
            const user = c.get("user");
            const { userId, organizationId } = c.req.valid("query");

            // Use admin client for billing collection access
            const { databases: adminDatabases } = await createAdminClient();

            // Determine which entity to query
            const queryUserId = userId || (organizationId ? undefined : user.$id);
            const queryOrgId = organizationId;

            let queries = [];
            if (queryOrgId) {
                queries = [
                    Query.equal("organizationId", queryOrgId),
                    Query.equal("type", BillingAccountType.ORG),
                ];
            } else if (queryUserId) {
                queries = [
                    Query.equal("userId", queryUserId),
                    Query.equal("type", BillingAccountType.PERSONAL),
                ];
            } else {
                return c.json({ error: "userId or organizationId required" }, 400);
            }

            const billingAccounts = await adminDatabases.listDocuments<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [...queries, Query.limit(1)]
            );

            if (billingAccounts.total === 0) {
                return c.json({
                    data: null,
                    hasPaymentMethod: false,
                    needsSetup: true,
                });
            }

            const account = billingAccounts.documents[0];
            const hasPaymentMethod = !!account.razorpaySubscriptionId || !!account.razorpayMandateId || !!account.razorpayTokenId;

            // Calculate days until suspension if in DUE status
            let daysUntilSuspension: number | undefined;
            if (account.billingStatus === BillingStatus.DUE && account.gracePeriodEnd) {
                const gracePeriodEnd = new Date(account.gracePeriodEnd);
                const now = new Date();
                daysUntilSuspension = Math.max(
                    0,
                    Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                );
            }

            return c.json({
                data: account,
                hasPaymentMethod,
                needsSetup: false,
                daysUntilSuspension,
                currency: BILLING_CURRENCY,
            });
        }
    )

    /**
     * POST /billing/setup
     * Create billing account and Razorpay customer
     * 
     * E-MANDATE FLOW: This does NOT charge the user.
     * It only creates the billing account with mandateStatus: PENDING.
     * The user must complete mandate authorization separately.
     */
    .post(
        "/setup",
        sessionMiddleware,
        zValidator("json", setupBillingSchema),
        async (c) => {
            const user = c.get("user");
            const { type, userId, organizationId, billingEmail, contactName, contactPhone } = c.req.valid("json");

            // Verify authorization
            if (type === BillingAccountType.PERSONAL && userId !== user.$id) {
                return c.json({ error: "Cannot create billing for another user" }, 403);
            }

            // TODO: For ORG, verify user is OWNER or ADMIN of the organization

            // Use admin client for billing operations
            const { databases: adminDatabases } = await createAdminClient();

            // Check if billing account already exists
            const queries = type === BillingAccountType.ORG
                ? [Query.equal("organizationId", organizationId!), Query.equal("type", type)]
                : [Query.equal("userId", userId!), Query.equal("type", type)];

            const existing = await adminDatabases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [...queries, Query.limit(1)]
            );

            if (existing.total > 0) {
                return c.json({
                    data: existing.documents[0],
                });
            }

            // Create Razorpay customer
            let razorpayCustomer;
            try {
                razorpayCustomer = await createCustomer({
                    name: contactName,
                    email: billingEmail,
                    contact: contactPhone,
                    notes: {
                        fairlx_type: type,
                        fairlx_entity_id: type === BillingAccountType.ORG ? organizationId! : userId!,
                        fairlx_user_id: user.$id,
                    },
                });
            } catch {

            }

            // Calculate billing cycle
            const { start, end } = calculateBillingCycle();

            // Create billing account with PENDING mandate status
            // billingStatus remains ACTIVE for now - will be enforced after first invoice
            const billingAccount = await adminDatabases.createDocument<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                ID.unique(),
                {
                    type,
                    userId: type === BillingAccountType.PERSONAL ? userId : null,
                    organizationId: type === BillingAccountType.ORG ? organizationId : null,
                    razorpayCustomerId: razorpayCustomer.id,
                    // Mandate fields - pending authorization
                    mandateStatus: MandateStatus.PENDING,
                    mandateMaxAmount: 10000000, // ₹1,00,000 max (in paise)
                    // Billing status - ACTIVE until first invoice fails
                    billingStatus: BillingStatus.ACTIVE,
                    billingCycleStart: start,
                    billingCycleEnd: end,
                    billingEmail,
                }
            );

            // Log audit event
            await logBillingAudit(
                adminDatabases,
                billingAccount.$id,
                BillingAuditEventType.PAYMENT_METHOD_ADDED,
                {
                    actorUserId: user.$id,
                    metadata: {
                        razorpayCustomerId: razorpayCustomer.id,
                        billingEmail,
                        type,
                        mandateStatus: MandateStatus.PENDING,
                    },
                }
            );

            return c.json({ data: billingAccount });
        }
    )

    /**
     * GET /billing/checkout-options
     * Get Razorpay checkout options for frontend
     * 
     * REQUIRES: phone parameter (for Razorpay recurring payments)
     * OPTIONAL: paymentMethod (upi, card, netbanking) to force specific method
     */
    .get(
        "/checkout-options",
        sessionMiddleware,
        zValidator("query", checkoutOptionsSchema),
        async (c) => {
            const user = c.get("user");
            const { userId, organizationId, phone, paymentMethod } = c.req.valid("query");

            // Use admin client for billing collection access
            const { databases: adminDatabases } = await createAdminClient();

            // Get billing account
            const queryUserId = userId || (organizationId ? undefined : user.$id);
            const queryOrgId = organizationId;

            let queries = [];
            if (queryOrgId) {
                queries = [
                    Query.equal("organizationId", queryOrgId),
                    Query.equal("type", BillingAccountType.ORG),
                ];
            } else if (queryUserId) {
                queries = [
                    Query.equal("userId", queryUserId),
                    Query.equal("type", BillingAccountType.PERSONAL),
                ];
            } else {
                return c.json({ error: "userId or organizationId required" }, 400);
            }

            const billingAccounts = await adminDatabases.listDocuments<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [...queries, Query.limit(1)]
            );

            if (billingAccounts.total === 0) {
                return c.json({ error: "Billing account not found. Call /setup first." }, 404);
            }

            let account = billingAccounts.documents[0];

            // Update Razorpay customer with phone (REQUIRED for recurring payments)
            // Handle case where customer ID doesn't exist in Razorpay (e.g., after switching test/live mode)
            let razorpayCustomerId = account.razorpayCustomerId;
            try {
                await ensureCustomerContact(razorpayCustomerId, phone);
            } catch (error: unknown) {
                // Check if customer doesn't exist
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const apiError = error as any;
                if (apiError?.error?.code === "BAD_REQUEST_ERROR" &&
                    apiError?.error?.description?.includes("does not exist")) {
                    // Recreate the customer in Razorpay
                    const user = c.get("user");
                    const razorpayCustomer = await createCustomer({
                        name: user.name || "Organization Admin",
                        email: account.billingEmail || user.email,
                        contact: phone,
                        notes: {
                            fairlx_type: account.type,
                            fairlx_entity_id: account.organizationId || account.userId || "",
                            fairlx_user_id: user.$id,
                            recreated: "true",
                        },
                    });

                    razorpayCustomerId = razorpayCustomer.id;

                    // Update billing account with new customer ID
                    account = await adminDatabases.updateDocument(
                        DATABASE_ID,
                        BILLING_ACCOUNTS_ID,
                        account.$id,
                        { razorpayCustomerId }
                    );
                } else {
                    throw error;
                }
            }

            // FEATURE FLAG: Check for netbanking/eMandate early with user-friendly error
            // Note: The schema only allows "upi", "debitcard", "netbanking"
            // eMandate is typically set up via netbanking authType
            const { ENABLE_EMANDATE } = await import("@/config");
            if (!ENABLE_EMANDATE && paymentMethod === "netbanking") {
                return c.json({
                    error: "eMandate is temporarily unavailable",
                    message: "eMandate via Net Banking is temporarily disabled pending company incorporation. Please use UPI AutoPay or Card payment.",
                    availableMethods: ["upi", "debitcard"],
                    reason: "pending_company_incorporation",
                }, 400);
            }

            // Create mandate authorization order (₹1 auth, not captured)
            // authType determines which payment method is shown
            const order = await createMandateAuthorizationOrder({
                customerId: razorpayCustomerId, // Use potentially recreated customer ID
                maxAmount: account.mandateMaxAmount || 10000000, // ₹1,00,000 default
                authType: paymentMethod as "upi" | "debitcard" | "netbanking" | "emandate" | undefined,
                tokenNotes: {
                    fairlx_billing_account_id: account.$id,
                    fairlx_type: account.type,
                },
            });

            // Return checkout options for frontend (mandate authorization)
            // NOTE: contact is REQUIRED for recurring payments (e-Mandate)
            // Map paymentMethod to Razorpay's method parameter
            // CRITICAL: Razorpay uses 'card' not 'debitcard' for checkout method restriction
            const razorpayMethod = paymentMethod === "upi" ? "upi" : paymentMethod === "debitcard" ? "card" : undefined;

            return c.json({
                data: {
                    key: getPublicKey(),
                    orderId: order.id,
                    customerId: razorpayCustomerId, // Use potentially recreated customer ID
                    // Method restriction - tells Razorpay which payment method to show
                    method: razorpayMethod,
                    name: "Fairlx Auto-Debit Authorization",
                    description: paymentMethod === "upi"
                        ? "Authorize UPI Autopay for automatic billing (no charge today)"
                        : "Authorize automatic billing for your usage (no charge today)",
                    prefill: {
                        name: user.name || "",
                        email: account.billingEmail || user.email,
                        // Phone from query parameter (validated by schema)
                        contact: phone,
                    },
                    theme: {
                        color: "#3b82f6", // Fairlx blue
                    },
                    // Recurring payment config
                    recurring: true,
                    subscription_card_change: false,
                },
            });
        }
    )

    /**
     * POST /billing/payment-method
     * Activate e-Mandate after Razorpay checkout completes
     * 
     * E-MANDATE FLOW: This confirms mandate authorization.
     * No payment is captured - just saves the token for future auto-debits.
     */
    .post(
        "/payment-method",
        sessionMiddleware,
        zValidator("json", updatePaymentMethodSchema),
        async (c) => {
            const user = c.get("user");
            const { razorpayPaymentId, razorpaySignature } = c.req.valid("json");

            // Get billing account from payment notes
            const { getPayment, verifyPaymentSignature } = await import("@/lib/razorpay");
            const payment = await getPayment(razorpayPaymentId);

            // Get order ID from payment to verify signature
            const orderId = payment.order_id;
            if (!orderId) {
                return c.json({ error: "Payment missing order reference" }, 400);
            }

            // Verify signature using order+payment
            const isValid = verifyPaymentSignature(orderId, razorpayPaymentId, razorpaySignature);
            if (!isValid) {
                return c.json({ error: "Invalid payment signature" }, 400);
            }

            // Get billing account ID from payment notes
            const billingAccountId = payment.notes?.fairlx_billing_account_id;
            if (!billingAccountId) {
                return c.json({ error: "Payment missing billing account reference" }, 400);
            }

            const { databases: adminDatabases } = await createAdminClient();

            // Get billing account
            const account = await adminDatabases.getDocument<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                billingAccountId
            );

            // Extract token/mandate info from payment
            const tokenId = payment.token_id;

            // Update billing account with mandate info
            const updateData: Partial<BillingAccount> = {
                razorpayTokenId: tokenId || undefined,
                mandateStatus: MandateStatus.AUTHORIZED,
                paymentMethodType: payment.method,
            };

            // Extract card/bank details if available
            if (payment.card) {
                updateData.paymentMethodLast4 = payment.card.last4;
                updateData.paymentMethodBrand = payment.card.network;
            } else if (payment.bank) {
                updateData.paymentMethodBrand = payment.bank;
            }

            // If account was suspended, restore it
            if (account.billingStatus === BillingStatus.SUSPENDED) {
                updateData.billingStatus = BillingStatus.ACTIVE;
                updateData.gracePeriodEnd = undefined;
            }

            const updatedAccount = await adminDatabases.updateDocument<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                account.$id,
                updateData
            );

            // Log audit event - mandate activated
            await logBillingAudit(
                adminDatabases,
                account.$id,
                BillingAuditEventType.PAYMENT_METHOD_UPDATED,
                {
                    actorUserId: user.$id,
                    metadata: {
                        paymentId: razorpayPaymentId,
                        tokenId,
                        method: payment.method,
                        mandateStatus: MandateStatus.AUTHORIZED,
                    },
                }
            );

            // If account was restored from suspension, log that too
            if (account.billingStatus === BillingStatus.SUSPENDED) {
                await logBillingAudit(
                    adminDatabases,
                    account.$id,
                    BillingAuditEventType.ACCOUNT_RESTORED,
                    {
                        actorUserId: user.$id,
                        metadata: { previousStatus: BillingStatus.SUSPENDED },
                    }
                );
            }

            return c.json({
                data: updatedAccount,
                mandateActivated: true,
                restored: account.billingStatus === BillingStatus.SUSPENDED
            });
        }
    )

    /**
     * GET /billing/invoices
     * List invoices for billing account
     */
    .get(
        "/invoices",
        sessionMiddleware,
        zValidator("query", getInvoicesSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { billingAccountId, userId, organizationId, status, limit, offset } = c.req.valid("query");

            const queries: ReturnType<typeof Query.equal>[] = [];

            if (billingAccountId) {
                queries.push(Query.equal("billingAccountId", billingAccountId));
            } else if (organizationId) {
                queries.push(Query.equal("billingEntityId", organizationId));
                queries.push(Query.equal("billingEntityType", "organization"));
            } else if (userId) {
                queries.push(Query.equal("billingEntityId", userId));
                queries.push(Query.equal("billingEntityType", "user"));
            } else {
                // Default to current user
                queries.push(Query.equal("billingEntityId", user.$id));
            }

            if (status) {
                queries.push(Query.equal("status", status));
            }

            queries.push(Query.orderDesc("$createdAt"));
            queries.push(Query.limit(limit));
            queries.push(Query.offset(offset));

            const invoices = await databases.listDocuments<BillingInvoice>(
                DATABASE_ID,
                INVOICES_ID,
                queries
            );

            return c.json({
                data: {
                    documents: invoices.documents,
                    total: invoices.total,
                }
            });
        }
    )

    /**
     * POST /billing/retry-payment
     * Retry payment for a failed invoice using e-Mandate
     * 
     * E-MANDATE FLOW: Uses saved mandate token to attempt auto-debit.
     */
    .post(
        "/retry-payment",
        sessionMiddleware,
        zValidator("json", retryPaymentSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { invoiceId } = c.req.valid("json");

            // Get invoice
            const invoices = await databases.listDocuments<BillingInvoice>(
                DATABASE_ID,
                INVOICES_ID,
                [
                    Query.equal("invoiceId", invoiceId),
                    Query.limit(1),
                ]
            );

            if (invoices.total === 0) {
                return c.json({ error: "Invoice not found" }, 404);
            }

            const invoice = invoices.documents[0];

            // Verify invoice is in failed state
            if (invoice.status !== InvoiceStatus.FAILED && invoice.status !== InvoiceStatus.DUE) {
                return c.json({ error: "Invoice is not in a retryable state" }, 400);
            }

            // Get billing account
            const billingAccounts = await databases.listDocuments<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [
                    Query.equal("$id", invoice.billingAccountId),
                    Query.limit(1),
                ]
            );

            if (billingAccounts.total === 0) {
                return c.json({ error: "Billing account not found" }, 404);
            }

            const account = billingAccounts.documents[0];

            // Check for valid mandate
            if (!account.razorpayTokenId || account.mandateStatus !== MandateStatus.AUTHORIZED) {
                return c.json({
                    error: "No authorized payment method configured",
                    needsPaymentMethod: true,
                    mandateStatus: account.mandateStatus,
                }, 400);
            }

            // Log retry attempt
            const { databases: adminDatabases } = await createAdminClient();
            await logBillingAudit(
                adminDatabases,
                account.$id,
                BillingAuditEventType.PAYMENT_RETRY_SCHEDULED,
                {
                    actorUserId: user.$id,
                    invoiceId: invoice.$id,
                    metadata: {
                        invoiceId,
                        amount: invoice.amount,
                        retryCount: invoice.retryCount + 1,
                    },
                }
            );

            // Update retry count
            await adminDatabases.updateDocument(
                DATABASE_ID,
                INVOICES_ID,
                invoice.$id,
                { retryCount: invoice.retryCount + 1 }
            );

            // Attempt recurring payment using mandate
            try {
                const { createRecurringPayment } = await import("@/lib/razorpay");
                const result = await createRecurringPayment({
                    customerId: account.razorpayCustomerId,
                    tokenId: account.razorpayTokenId,
                    amount: invoice.amount,
                    invoiceId: invoice.invoiceId,
                    description: `Invoice ${invoice.invoiceId} - Retry`,
                    notes: {
                        fairlx_billing_account_id: account.$id,
                    },
                });

                return c.json({
                    data: {
                        paymentInitiated: true,
                        orderId: result.order.id,
                        paymentId: result.payment?.id,
                    },
                });
            } catch (error: unknown) {
                return c.json({
                    data: {
                        paymentInitiated: false,
                        error: error instanceof Error ? error.message : "Payment failed",
                        needsManualPayment: true,
                    },
                });
            }
        }
    )

    /**
     * GET /billing/status
     * Quick check of billing status (for frontend polling)
     */
    .get(
        "/status",
        sessionMiddleware,
        zValidator("query", getBillingAccountSchema),
        async (c) => {
            const user = c.get("user");
            const { userId, organizationId } = c.req.valid("query");

            // Use admin client for billing collection access
            const { databases: adminDatabases } = await createAdminClient();

            const queryUserId = userId || (organizationId ? undefined : user.$id);
            const queryOrgId = organizationId;

            let queries = [];
            if (queryOrgId) {
                queries = [
                    Query.equal("organizationId", queryOrgId),
                    Query.equal("type", BillingAccountType.ORG),
                ];
            } else if (queryUserId) {
                queries = [
                    Query.equal("userId", queryUserId),
                    Query.equal("type", BillingAccountType.PERSONAL),
                ];
            } else {
                return c.json({ status: BillingStatus.ACTIVE, needsSetup: true });
            }

            const billingAccounts = await adminDatabases.listDocuments<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [...queries, Query.limit(1)]
            );

            if (billingAccounts.total === 0) {
                return c.json({ status: BillingStatus.ACTIVE, needsSetup: true });
            }

            const account = billingAccounts.documents[0];
            let daysUntilSuspension: number | undefined;

            if (account.billingStatus === BillingStatus.DUE && account.gracePeriodEnd) {
                const gracePeriodEnd = new Date(account.gracePeriodEnd);
                const now = new Date();
                daysUntilSuspension = Math.max(
                    0,
                    Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                );
            }

            return c.json({
                status: account.billingStatus,
                needsSetup: false,
                hasPaymentMethod: !!account.razorpaySubscriptionId,
                daysUntilSuspension,
                gracePeriodEnd: account.gracePeriodEnd,
            });
        }
    );

export default app;
