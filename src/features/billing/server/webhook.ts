import "server-only";

import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import {
    DATABASE_ID,
    BILLING_ACCOUNTS_ID,
    BILLING_AUDIT_LOGS_ID,
    INVOICES_ID,
    BILLING_GRACE_PERIOD_DAYS,
} from "@/config";
import { createAdminClient } from "@/lib/appwrite";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { isEventProcessed, markEventProcessed } from "@/lib/processed-events-registry";

import {
    BillingStatus,
    MandateStatus,
    BillingAccount,
    BillingInvoice,
    BillingAuditEventType,
    InvoiceStatus,
    RazorpayWebhookEvent,
} from "../types";

/**
 * Razorpay Webhook Handler
 * 
 * CRITICAL: This handles all Razorpay webhook events for billing lifecycle.
 * 
 * Events Handled:
 * - payment.captured: Payment successful
 * - payment.failed: Payment failed
 * - token.confirmed: E-Mandate authorized
 * - token.rejected/cancelled: E-Mandate failed
 * - subscription.charged: Subscription charged successfully
 * - subscription.halted: Subscription halted (mandate failed)
 * - subscription.cancelled: Subscription cancelled
 * 
 * SECURITY:
 * - All webhooks are signature-verified
 * - Event IDs are stored in DATABASE for persistent idempotency
 * - All events are audit-logged
 * 
 * CRITICAL INVARIANT: Webhooks may ONLY modify:
 * - Invoice status
 * - Billing account status (billingStatus, mandateStatus)
 * - Mandate/token information
 * 
 * Webhooks MUST NEVER:
 * - Touch usage_events
 * - Modify usage_aggregations
 * - Infer or calculate usage
 */

// NOTE: Idempotency now handled by @/lib/processed-events-registry
// Database-backed for persistence across restarts

const app = new Hono()
    /**
     * POST /webhooks/razorpay
     * Main webhook endpoint for Razorpay events
     */
    .post("/razorpay", async (c) => {
        // Get raw body for signature verification
        const rawBody = await c.req.text();
        const signature = c.req.header("x-razorpay-signature");

        if (!signature) {
            console.warn("[Webhook] Missing signature header");
            return c.json({ error: "Missing signature" }, 400);
        }

        // Verify signature
        if (!verifyWebhookSignature(rawBody, signature)) {
            console.warn("[Webhook] Invalid signature");
            return c.json({ error: "Invalid signature" }, 401);
        }

        // Parse event
        let event: RazorpayWebhookEvent;
        try {
            event = JSON.parse(rawBody);
        } catch {
            console.error("[Webhook] Failed to parse event body");
            return c.json({ error: "Invalid JSON" }, 400);
        }

        // Generate event ID from payload for idempotency
        const eventId = `${event.event}-${event.created_at}-${event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || "unknown"}`;

        const { databases } = await createAdminClient();

        // Check idempotency (database-backed for production safety)
        if (await isEventProcessed(databases, eventId, "webhook")) {
            console.log(`[Webhook] Skipping duplicate event: ${eventId}`);
            return c.json({ status: "already_processed" });
        }

        console.log(`[Webhook] Processing event: ${event.event}`);

        try {
            // Route to appropriate handler
            switch (event.event) {
                case "payment.captured":
                    await handlePaymentCaptured(databases, event, eventId);
                    break;

                case "payment.authorized":
                    await handlePaymentAuthorized(databases, event, eventId);
                    break;

                case "payment.failed":
                    await handlePaymentFailed(databases, event, eventId);
                    break;

                case "subscription.charged":
                    await handleSubscriptionCharged(databases, event, eventId);
                    break;

                case "subscription.halted":
                    await handleSubscriptionHalted(databases, event, eventId);
                    break;

                case "subscription.cancelled":
                    await handleSubscriptionCancelled(databases, event, eventId);
                    break;

                case "refund.processed":
                    await handleRefundProcessed(databases, event, eventId);
                    break;

                case "refund.failed":
                    await handleRefundFailed(databases, event, eventId);
                    break;

                // E-Mandate events
                case "token.confirmed":
                    await handleTokenConfirmed(databases, event, eventId);
                    break;

                case "token.rejected":
                case "token.cancelled":
                    await handleTokenFailed(databases, event, eventId);
                    break;

                default:
                    console.log(`[Webhook] Unhandled event type: ${event.event}`);
            }

            // Mark as processed (persisted to database)
            await markEventProcessed(databases, eventId, "webhook");

            return c.json({ status: "processed" });
        } catch (error) {
            console.error(`[Webhook] Error processing ${event.event}:`, error);
            // Return 200 to prevent Razorpay from retrying (we log the error)
            return c.json({ status: "error_logged" });
        }
    });

/**
 * Handle payment.captured event
 * 
 * Called when a payment is successfully captured.
 */
async function handlePaymentCaptured(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const payment = event.payload.payment?.entity;
    if (!payment) {
        console.warn("[Webhook] payment.captured missing payment entity");
        return;
    }

    // Get billing account from payment notes
    const billingAccountId = payment.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        console.warn("[Webhook] payment.captured missing billing account ID in notes");
        return;
    }

    // Get billing account
    const account = await databases.getDocument<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId
    );

    // Update account status if needed
    const updates: Partial<BillingAccount> = {
        lastPaymentAt: new Date().toISOString(),
    };

    // If account was DUE or SUSPENDED, restore to ACTIVE
    if (account.billingStatus !== BillingStatus.ACTIVE) {
        updates.billingStatus = BillingStatus.ACTIVE;
        updates.gracePeriodEnd = undefined;
    }

    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId,
        updates
    );

    // Find and update associated invoice
    const invoiceId = payment.notes?.fairlx_invoice_id;
    if (invoiceId) {
        const invoices = await databases.listDocuments<BillingInvoice>(
            DATABASE_ID,
            INVOICES_ID,
            [Query.equal("invoiceId", invoiceId), Query.limit(1)]
        );

        if (invoices.total > 0) {
            await databases.updateDocument(
                DATABASE_ID,
                INVOICES_ID,
                invoices.documents[0].$id,
                {
                    status: InvoiceStatus.PAID,
                    razorpayPaymentId: payment.id,
                    paidAt: new Date().toISOString(),
                }
            );
        }
    }

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.PAYMENT_SUCCEEDED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                paymentId: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
            }),
        }
    );

    // If account was restored from suspension, log that too
    if (account.billingStatus === BillingStatus.SUSPENDED) {
        await databases.createDocument(
            DATABASE_ID,
            BILLING_AUDIT_LOGS_ID,
            ID.unique(),
            {
                billingAccountId,
                eventType: BillingAuditEventType.ACCOUNT_RESTORED,
                razorpayEventId: eventId,
                metadata: JSON.stringify({
                    previousStatus: BillingStatus.SUSPENDED,
                    paymentId: payment.id,
                }),
            }
        );
    }

    console.log(`[Webhook] Processed payment.captured for account ${billingAccountId}`);
}

/**
 * Handle payment.failed event
 * 
 * Called when a payment attempt fails.
 * Starts grace period if not already started.
 */
async function handlePaymentFailed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const payment = event.payload.payment?.entity;
    if (!payment) {
        console.warn("[Webhook] payment.failed missing payment entity");
        return;
    }

    const billingAccountId = payment.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        console.warn("[Webhook] payment.failed missing billing account ID in notes");
        return;
    }

    // Get billing account
    const account = await databases.getDocument<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId
    );

    // Calculate grace period end
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + BILLING_GRACE_PERIOD_DAYS);

    // Update account to DUE status with grace period
    const updates: Partial<BillingAccount> = {
        lastPaymentFailedAt: new Date().toISOString(),
    };

    // Only set DUE status and grace period if not already set
    if (account.billingStatus === BillingStatus.ACTIVE) {
        updates.billingStatus = BillingStatus.DUE;
        updates.gracePeriodEnd = gracePeriodEnd.toISOString();
    }

    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId,
        updates
    );

    // Find and update associated invoice
    const invoiceId = payment.notes?.fairlx_invoice_id;
    if (invoiceId) {
        const invoices = await databases.listDocuments<BillingInvoice>(
            DATABASE_ID,
            INVOICES_ID,
            [Query.equal("invoiceId", invoiceId), Query.limit(1)]
        );

        if (invoices.total > 0) {
            await databases.updateDocument(
                DATABASE_ID,
                INVOICES_ID,
                invoices.documents[0].$id,
                {
                    status: InvoiceStatus.FAILED,
                    failureReason: payment.error_description || payment.error_code || "Payment failed",
                    retryCount: invoices.documents[0].retryCount + 1,
                }
            );
        }
    }

    // Log audit events
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.PAYMENT_FAILED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                paymentId: payment.id,
                amount: payment.amount,
                errorCode: payment.error_code,
                errorDescription: payment.error_description,
            }),
        }
    );

    // If this started the grace period, log that too
    if (account.billingStatus === BillingStatus.ACTIVE) {
        await databases.createDocument(
            DATABASE_ID,
            BILLING_AUDIT_LOGS_ID,
            ID.unique(),
            {
                billingAccountId,
                eventType: BillingAuditEventType.GRACE_PERIOD_STARTED,
                razorpayEventId: eventId,
                metadata: JSON.stringify({
                    gracePeriodEnd: gracePeriodEnd.toISOString(),
                    daysRemaining: BILLING_GRACE_PERIOD_DAYS,
                }),
            }
        );
    }

    console.log(`[Webhook] Processed payment.failed for account ${billingAccountId}`);
}

/**
 * Handle subscription.charged event
 * 
 * Called when a subscription payment is successfully processed.
 */
async function handleSubscriptionCharged(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _eventId: string
) {
    const subscription = event.payload.subscription?.entity;
    if (!subscription) {
        console.warn("[Webhook] subscription.charged missing subscription entity");
        return;
    }

    const billingAccountId = subscription.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        console.warn("[Webhook] subscription.charged missing billing account ID in notes");
        return;
    }

    // Update billing cycle dates
    const cycleStart = new Date(subscription.current_start * 1000);
    const cycleEnd = new Date(subscription.current_end * 1000);

    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId,
        {
            billingCycleStart: cycleStart.toISOString(),
            billingCycleEnd: cycleEnd.toISOString(),
            lastPaymentAt: new Date().toISOString(),
            billingStatus: BillingStatus.ACTIVE,
            gracePeriodEnd: null,
        }
    );

    console.log(`[Webhook] Processed subscription.charged for account ${billingAccountId}`);
}

/**
 * Handle subscription.halted event
 * 
 * Called when a subscription is halted due to failed payments.
 */
async function handleSubscriptionHalted(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const subscription = event.payload.subscription?.entity;
    if (!subscription) {
        console.warn("[Webhook] subscription.halted missing subscription entity");
        return;
    }

    const billingAccountId = subscription.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        console.warn("[Webhook] subscription.halted missing billing account ID in notes");
        return;
    }

    // Get billing account to check current state
    const account = await databases.getDocument<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId
    );

    // If grace period has expired, suspend the account
    if (account.gracePeriodEnd) {
        const gracePeriodEnd = new Date(account.gracePeriodEnd);
        const now = new Date();

        if (now > gracePeriodEnd) {
            await databases.updateDocument(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                billingAccountId,
                { billingStatus: BillingStatus.SUSPENDED }
            );

            await databases.createDocument(
                DATABASE_ID,
                BILLING_AUDIT_LOGS_ID,
                ID.unique(),
                {
                    billingAccountId,
                    eventType: BillingAuditEventType.ACCOUNT_SUSPENDED,
                    razorpayEventId: eventId,
                    metadata: JSON.stringify({
                        reason: "Grace period expired - subscription halted",
                        gracePeriodEnd: account.gracePeriodEnd,
                    }),
                }
            );

            console.log(`[Webhook] Account ${billingAccountId} suspended after subscription halt`);
        }
    }
}

/**
 * Handle subscription.cancelled event
 * 
 * Called when a subscription is cancelled.
 */
async function handleSubscriptionCancelled(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const subscription = event.payload.subscription?.entity;
    if (!subscription) {
        console.warn("[Webhook] subscription.cancelled missing subscription entity");
        return;
    }

    const billingAccountId = subscription.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        console.warn("[Webhook] subscription.cancelled missing billing account ID in notes");
        return;
    }

    // Clear subscription ID from billing account
    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        billingAccountId,
        { razorpaySubscriptionId: null }
    );

    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.SUBSCRIPTION_CANCELLED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                subscriptionId: subscription.id,
            }),
        }
    );

    console.log(`[Webhook] Processed subscription.cancelled for account ${billingAccountId}`);
}

/**
 * Handle payment.authorized event
 * 
 * Called when a payment is authorized (before capture).
 * Used for tracking and audit purposes.
 */
async function handlePaymentAuthorized(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const payment = event.payload.payment?.entity;
    if (!payment) {
        console.warn("[Webhook] payment.authorized missing payment entity");
        return;
    }

    const billingAccountId = payment.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        // Not a Fairlx payment, skip
        console.log("[Webhook] payment.authorized - not a Fairlx payment, skipping");
        return;
    }

    // Log audit event for tracking
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.PAYMENT_AUTHORIZED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                paymentId: payment.id,
                amount: payment.amount,
                currency: payment.currency,
            }),
        }
    );

    console.log(`[Webhook] Processed payment.authorized for account ${billingAccountId}`);
}

/**
 * Handle refund.processed event
 * 
 * Called when a refund is successfully processed.
 */
async function handleRefundProcessed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const refund = event.payload.refund?.entity;
    if (!refund) {
        console.warn("[Webhook] refund.processed missing refund entity");
        return;
    }

    const billingAccountId = refund.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        console.log("[Webhook] refund.processed - not a Fairlx refund, skipping");
        return;
    }

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.REFUND_PROCESSED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                refundId: refund.id,
                paymentId: refund.payment_id,
                amount: refund.amount,
                reason: refund.notes?.reason || "Not specified",
            }),
        }
    );

    console.log(`[Webhook] Processed refund.processed for account ${billingAccountId}`);
}

/**
 * Handle refund.failed event
 * 
 * Called when a refund fails.
 */
async function handleRefundFailed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const refund = event.payload.refund?.entity;
    if (!refund) {
        console.warn("[Webhook] refund.failed missing refund entity");
        return;
    }

    const billingAccountId = refund.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
        console.log("[Webhook] refund.failed - not a Fairlx refund, skipping");
        return;
    }

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId,
            eventType: BillingAuditEventType.REFUND_FAILED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                refundId: refund.id,
                paymentId: refund.payment_id,
                amount: refund.amount,
            }),
        }
    );

    console.log(`[Webhook] Processed refund.failed for account ${billingAccountId}`);
}

// ============================================================================
// E-MANDATE TOKEN HANDLERS
// ============================================================================

/**
 * Handle token.confirmed webhook
 * 
 * Called when e-Mandate authorization is confirmed by the bank/NPCI.
 * Updates billing account with mandate status AUTHORIZED.
 */
async function handleTokenConfirmed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (event.payload as any)?.token?.entity;
    if (!token) {
        console.warn("[Webhook] token.confirmed missing token entity");
        return;
    }

    const customerId = token.customer_id;
    if (!customerId) {
        console.warn("[Webhook] token.confirmed missing customer_id");
        return;
    }

    // Find billing account by customer ID
    const billingAccounts = await databases.listDocuments<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        [
            Query.equal("razorpayCustomerId", customerId),
            Query.limit(1),
        ]
    );

    if (billingAccounts.total === 0) {
        console.log("[Webhook] token.confirmed - billing account not found for customer:", customerId);
        return;
    }

    const account = billingAccounts.documents[0];

    // Update billing account with mandate authorization
    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        account.$id,
        {
            razorpayTokenId: token.id,
            razorpayMandateId: token.id,
            mandateStatus: MandateStatus.AUTHORIZED,
            paymentMethodType: token.method || "emandate",
            paymentMethodBrand: token.bank || token.issuer || undefined,
            paymentMethodLast4: token.last4 || undefined,
        }
    );

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: account.$id,
            eventType: BillingAuditEventType.PAYMENT_METHOD_ADDED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                tokenId: token.id,
                method: token.method,
                bank: token.bank,
                mandateStatus: MandateStatus.AUTHORIZED,
            }),
        }
    );

    console.log(`[Webhook] Processed token.confirmed for account ${account.$id}`);
}

/**
 * Handle token.rejected / token.cancelled webhook
 * 
 * Called when e-Mandate authorization fails or is cancelled.
 * Updates billing account with mandate status FAILED or CANCELLED.
 */
async function handleTokenFailed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (event.payload as any)?.token?.entity;
    if (!token) {
        console.warn("[Webhook] token.failed missing token entity");
        return;
    }

    const customerId = token.customer_id;
    if (!customerId) {
        console.warn("[Webhook] token.failed missing customer_id");
        return;
    }

    // Find billing account by customer ID
    const billingAccounts = await databases.listDocuments<BillingAccount>(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        [
            Query.equal("razorpayCustomerId", customerId),
            Query.limit(1),
        ]
    );

    if (billingAccounts.total === 0) {
        console.log("[Webhook] token.failed - billing account not found for customer:", customerId);
        return;
    }

    const account = billingAccounts.documents[0];

    const newStatus = event.event === "token.cancelled"
        ? MandateStatus.CANCELLED
        : MandateStatus.FAILED;

    // Update billing account with failed/cancelled status
    await databases.updateDocument(
        DATABASE_ID,
        BILLING_ACCOUNTS_ID,
        account.$id,
        {
            mandateStatus: newStatus,
        }
    );

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: account.$id,
            eventType: BillingAuditEventType.PAYMENT_METHOD_REMOVED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                tokenId: token.id,
                reason: token.error_description || event.event,
                mandateStatus: newStatus,
            }),
        }
    );

    console.log(`[Webhook] Processed ${event.event} for account ${account.$id}`);
}

export default app;
