import "server-only";

import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import {
    DATABASE_ID,
    BILLING_ACCOUNTS_ID,
    BILLING_AUDIT_LOGS_ID,
    INVOICES_ID,
    WALLETS_ID,
} from "@/config";
import { createAdminClient } from "@/lib/appwrite";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { isEventProcessed, markEventProcessed } from "@/lib/processed-events-registry";

import {
    BillingStatus,
    BillingAccount,
    BillingInvoice,
    BillingAuditEventType,
    InvoiceStatus,
    RazorpayWebhookEvent,
} from "../types";

import { Wallet } from "@/features/wallet/types";
import { topUpWallet, refundToWallet } from "@/features/wallet/services/wallet-service";

/**
 * Razorpay Webhook Handler (Wallet-Only)
 * 
 * CRITICAL: This handles Razorpay webhook events for wallet top-ups.
 * 
 * Events Handled:
 * - payment.captured: Payment successful → credit wallet
 * - payment.authorized: Payment authorized → audit log only
 * - payment.failed: Payment failed → audit log only
 * - refund.processed: Refund successful → credit wallet
 * - refund.failed: Refund failed → audit log only
 * 
 * REMOVED (wallet-only model):
 * - subscription.* events (no subscriptions)
 * - token.* events (no e-mandates)
 * 
 * SECURITY:
 * - All webhooks are signature-verified
 * - Event IDs are stored in DATABASE for persistent idempotency
 * - All events are audit-logged
 * 
 * CRITICAL INVARIANT: Webhooks MUST NEVER:
 * - Touch usage_events
 * - Modify usage_aggregations
 * - Infer or calculate usage
 */

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
            return c.json({ error: "Missing signature" }, 400);
        }

        // Verify signature
        if (!verifyWebhookSignature(rawBody, signature)) {
            return c.json({ error: "Invalid signature" }, 401);
        }

        // Parse event
        let event: RazorpayWebhookEvent;
        try {
            event = JSON.parse(rawBody);
        } catch {
            return c.json({ error: "Invalid JSON" }, 400);
        }

        // Generate event ID from payload for idempotency
        const eventId = `${event.event}-${event.created_at}-${event.payload?.payment?.entity?.id || "unknown"}`;

        const { databases } = await createAdminClient();

        // Check idempotency (database-backed for production safety)
        if (await isEventProcessed(databases, eventId, "webhook")) {
            return c.json({ status: "already_processed" });
        }

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

                case "refund.processed":
                    await handleRefundProcessed(databases, event, eventId);
                    break;

                case "refund.failed":
                    await handleRefundFailed(databases, event, eventId);
                    break;

                default:
                    // Unhandled event type — ignore
                    break;
            }

            // Mark as processed (persisted to database)
            await markEventProcessed(databases, eventId, "webhook");

            return c.json({ status: "processed" });
        } catch {
            // Return 200 to prevent Razorpay from retrying (we log the error)
            return c.json({ status: "error_logged" });
        }
    });

// ============================================================================
// PAYMENT HANDLERS
// ============================================================================

/**
 * Handle payment.captured event
 * 
 * Called when a wallet top-up payment is successfully captured.
 * Credits the user's wallet with the payment amount.
 */
async function handlePaymentCaptured(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const payment = event.payload.payment?.entity;
    if (!payment) {
        return;
    }

    // Check if this is a wallet top-up payment
    const walletId = payment.notes?.fairlx_wallet_id;
    const billingAccountId = payment.notes?.fairlx_billing_account_id;

    if (!walletId) {
        // Not a wallet top-up, skip
        return;
    }

    // Credit the wallet (idempotent via payment ID)
    const result = await topUpWallet(databases, walletId, payment.amount, {
        idempotencyKey: `webhook_${payment.id}`,
        paymentId: payment.id,
        description: `Wallet top-up via Razorpay (${payment.method})`,
    });

    if (result.success && result.error !== "already_processed") {
        // Update billing account status if needed
        if (billingAccountId) {
            try {
                const account = await databases.getDocument<BillingAccount>(
                    DATABASE_ID,
                    BILLING_ACCOUNTS_ID,
                    billingAccountId
                );

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

                // If account was restored from suspension, log that
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
                                walletTopupAmount: payment.amount,
                            }),
                        }
                    );
                }
            } catch {
                // Don't fail the webhook if billing account update fails
            }
        }

        // Find and update associated invoice (if top-up was for a specific invoice)
        const invoiceId = payment.notes?.fairlx_invoice_id;
        if (invoiceId) {
            try {
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
                            walletTransactionId: result.transaction?.$id,
                            paidAt: new Date().toISOString(),
                        }
                    );
                }
            } catch {
                // Don't fail the webhook if invoice update fails
            }
        }
    }

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: billingAccountId || null,
            eventType: BillingAuditEventType.WALLET_TOPUP,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                paymentId: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
                walletId,
                walletCredited: result.success && result.error !== "already_processed",
            }),
        }
    );
}

/**
 * Handle payment.authorized event
 * 
 * Called when a payment is authorized (before capture).
 * Audit log only — no wallet changes.
 */
async function handlePaymentAuthorized(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const payment = event.payload.payment?.entity;
    if (!payment) {
        return;
    }

    const billingAccountId = payment.notes?.fairlx_billing_account_id;
    if (!billingAccountId) {
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
}

/**
 * Handle payment.failed event
 * 
 * Called when a payment attempt fails.
 * Audit log only — no grace period or mandate logic.
 */
async function handlePaymentFailed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const payment = event.payload.payment?.entity;
    if (!payment) {
        return;
    }

    const billingAccountId = payment.notes?.fairlx_billing_account_id;

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: billingAccountId || null,
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
}

// ============================================================================
// REFUND HANDLERS
// ============================================================================

/**
 * Handle refund.processed event
 * 
 * Called when a refund is successfully processed.
 * Credits the wallet with the refunded amount.
 */
async function handleRefundProcessed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const refund = event.payload.refund?.entity;
    if (!refund) {
        return;
    }

    const walletId = refund.notes?.fairlx_wallet_id;
    const billingAccountId = refund.notes?.fairlx_billing_account_id;

    // Credit wallet if we know which wallet to credit
    if (walletId) {
        await refundToWallet(databases, walletId, refund.amount, {
            referenceId: refund.payment_id,
            idempotencyKey: `refund_${refund.id}`,
            reason: refund.notes?.reason || "Razorpay refund",
        });
    } else if (billingAccountId) {
        // Try to find the wallet via billing account
        try {
            const account = await databases.getDocument<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                billingAccountId
            );

            const walletQuery = account.organizationId
                ? [Query.equal("organizationId", account.organizationId)]
                : [Query.equal("userId", account.userId!)];

            const wallets = await databases.listDocuments<Wallet>(
                DATABASE_ID,
                WALLETS_ID,
                [...walletQuery, Query.limit(1)]
            );

            if (wallets.total > 0) {
                await refundToWallet(databases, wallets.documents[0].$id, refund.amount, {
                    referenceId: refund.payment_id,
                    idempotencyKey: `refund_${refund.id}`,
                    reason: refund.notes?.reason || "Razorpay refund",
                });
            }
        } catch {
            // Log but don't fail
        }
    }

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: billingAccountId || null,
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
}

/**
 * Handle refund.failed event
 * 
 * Called when a refund fails. Audit log only.
 */
async function handleRefundFailed(
    databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
    event: RazorpayWebhookEvent,
    eventId: string
) {
    const refund = event.payload.refund?.entity;
    if (!refund) {
        return;
    }

    const billingAccountId = refund.notes?.fairlx_billing_account_id;

    // Log audit event
    await databases.createDocument(
        DATABASE_ID,
        BILLING_AUDIT_LOGS_ID,
        ID.unique(),
        {
            billingAccountId: billingAccountId || null,
            eventType: BillingAuditEventType.REFUND_FAILED,
            razorpayEventId: eventId,
            metadata: JSON.stringify({
                refundId: refund.id,
                paymentId: refund.payment_id,
                amount: refund.amount,
            }),
        }
    );
}

export default app;
