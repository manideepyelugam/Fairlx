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
    createSubscription,
    getOrCreateBasePlan,
    getPublicKey,
    verifySubscriptionSignature,
} from "@/lib/razorpay";

import {
    BillingStatus,
    BillingAccountType,
    BillingAccount,
    BillingInvoice,
    BillingAuditEventType,
    InvoiceStatus,
} from "../types";

import {
    setupBillingSchema,
    getBillingAccountSchema,
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
    } catch (error) {
        console.error("[Billing] Failed to log audit event:", error);
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
            const databases = c.get("databases");
            const { userId, organizationId } = c.req.valid("query");

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

            const billingAccounts = await databases.listDocuments<BillingAccount>(
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
            const hasPaymentMethod = !!account.razorpaySubscriptionId || !!account.razorpayMandateId;

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
     */
    .post(
        "/setup",
        sessionMiddleware,
        zValidator("json", setupBillingSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { type, userId, organizationId, billingEmail, contactName, contactPhone } = c.req.valid("json");

            // Verify authorization
            if (type === BillingAccountType.PERSONAL && userId !== user.$id) {
                return c.json({ error: "Cannot create billing for another user" }, 403);
            }

            // TODO: For ORG, verify user is OWNER or ADMIN of the organization

            // Check if billing account already exists
            const queries = type === BillingAccountType.ORG
                ? [Query.equal("organizationId", organizationId!), Query.equal("type", type)]
                : [Query.equal("userId", userId!), Query.equal("type", type)];

            const existing = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [...queries, Query.limit(1)]
            );

            if (existing.total > 0) {
                return c.json({
                    error: "Billing account already exists",
                    data: existing.documents[0],
                }, 400);
            }

            // Create Razorpay customer
            const razorpayCustomer = await createCustomer({
                name: contactName,
                email: billingEmail,
                contact: contactPhone,
                notes: {
                    fairlx_type: type,
                    fairlx_entity_id: type === BillingAccountType.ORG ? organizationId! : userId!,
                    fairlx_user_id: user.$id,
                },
            });

            // Calculate billing cycle
            const { start, end } = calculateBillingCycle();

            // Create billing account
            const { databases: adminDatabases } = await createAdminClient();
            const billingAccount = await adminDatabases.createDocument<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                ID.unique(),
                {
                    type,
                    userId: type === BillingAccountType.PERSONAL ? userId : null,
                    organizationId: type === BillingAccountType.ORG ? organizationId : null,
                    razorpayCustomerId: razorpayCustomer.id,
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
                BillingAuditEventType.SUBSCRIPTION_CREATED,
                {
                    actorUserId: user.$id,
                    metadata: {
                        razorpayCustomerId: razorpayCustomer.id,
                        billingEmail,
                        type,
                    },
                }
            );

            return c.json({ data: billingAccount });
        }
    )

    /**
     * GET /billing/checkout-options
     * Get Razorpay checkout options for frontend
     */
    .get(
        "/checkout-options",
        sessionMiddleware,
        zValidator("query", getBillingAccountSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { userId, organizationId } = c.req.valid("query");

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

            const billingAccounts = await databases.listDocuments<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [...queries, Query.limit(1)]
            );

            if (billingAccounts.total === 0) {
                return c.json({ error: "Billing account not found. Call /setup first." }, 404);
            }

            const account = billingAccounts.documents[0];

            // Get or create the base plan
            const plan = await getOrCreateBasePlan();

            // Create subscription for the customer
            const subscription = await createSubscription({
                planId: plan.id,
                customerId: account.razorpayCustomerId,
                notes: {
                    fairlx_billing_account_id: account.$id,
                    fairlx_type: account.type,
                },
            });

            // Update billing account with subscription ID
            const { databases: adminDatabases } = await createAdminClient();
            await adminDatabases.updateDocument(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                account.$id,
                { razorpaySubscriptionId: subscription.id }
            );

            // Return checkout options for frontend
            return c.json({
                data: {
                    key: getPublicKey(),
                    subscriptionId: subscription.id,
                    name: "Fairlx Billing",
                    description: "Monthly usage-based billing",
                    prefill: {
                        name: user.name || "",
                        email: account.billingEmail || user.email,
                    },
                    theme: {
                        color: "#3b82f6", // Fairlx blue
                    },
                    currency: BILLING_CURRENCY,
                },
            });
        }
    )

    /**
     * POST /billing/payment-method
     * Update payment method after Razorpay checkout completes
     */
    .post(
        "/payment-method",
        sessionMiddleware,
        zValidator("json", updatePaymentMethodSchema),
        async (c) => {
            const user = c.get("user");
            const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = c.req.valid("json");

            if (!razorpaySubscriptionId) {
                return c.json({ error: "subscriptionId is required" }, 400);
            }

            // Verify signature
            const isValid = verifySubscriptionSignature(
                razorpaySubscriptionId,
                razorpayPaymentId,
                razorpaySignature
            );

            if (!isValid) {
                return c.json({ error: "Invalid payment signature" }, 400);
            }

            // Find billing account by subscription ID
            const { databases: adminDatabases } = await createAdminClient();
            const billingAccounts = await adminDatabases.listDocuments<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [
                    Query.equal("razorpaySubscriptionId", razorpaySubscriptionId),
                    Query.limit(1),
                ]
            );

            if (billingAccounts.total === 0) {
                return c.json({ error: "Billing account not found" }, 404);
            }

            const account = billingAccounts.documents[0];

            // Get payment details to extract card info
            const { getPayment } = await import("@/lib/razorpay");
            const payment = await getPayment(razorpayPaymentId);

            // Update billing account with payment method info
            const updateData: Partial<BillingAccount> = {
                lastPaymentAt: new Date().toISOString(),
                paymentMethodType: payment.method,
            };

            // Extract card details if available
            if (payment.card) {
                updateData.paymentMethodLast4 = payment.card.last4;
                updateData.paymentMethodBrand = payment.card.network;
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

            // Log audit event
            await logBillingAudit(
                adminDatabases,
                account.$id,
                BillingAuditEventType.PAYMENT_METHOD_UPDATED,
                {
                    actorUserId: user.$id,
                    metadata: {
                        paymentId: razorpayPaymentId,
                        method: payment.method,
                        last4: payment.card?.last4,
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

            return c.json({ data: updatedAccount, restored: account.billingStatus === BillingStatus.SUSPENDED });
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
     * Retry payment for a failed invoice
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

            if (!account.razorpaySubscriptionId) {
                return c.json({
                    error: "No payment method configured",
                    needsPaymentMethod: true,
                }, 400);
            }

            // For subscription-based billing, the retry happens via Razorpay
            // We return the checkout options for the user to complete payment
            const { getSubscription } = await import("@/lib/razorpay");
            const subscription = await getSubscription(account.razorpaySubscriptionId);

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

            return c.json({
                data: {
                    subscriptionStatus: subscription.status,
                    checkoutRequired: subscription.status === "halted",
                    checkoutOptions: subscription.status === "halted" ? {
                        key: getPublicKey(),
                        subscriptionId: account.razorpaySubscriptionId,
                        name: "Fairlx Billing",
                        description: `Payment for invoice ${invoiceId}`,
                        prefill: {
                            email: account.billingEmail,
                        },
                    } : undefined,
                },
            });
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
            const databases = c.get("databases");
            const { userId, organizationId } = c.req.valid("query");

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

            const billingAccounts = await databases.listDocuments<BillingAccount>(
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
