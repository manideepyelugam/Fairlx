import "server-only";

import { Hono } from "hono";
import { Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import {
    DATABASE_ID,
    BILLING_ACCOUNTS_ID,
    BILLING_CURRENCY,
    WALLET_DAILY_TOPUP_LIMIT,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { createOrder, getPublicKey, verifyPaymentSignature } from "@/lib/razorpay";

import {
    createTopupOrderSchema,
    verifyTopupSchema,
    getWalletBalanceSchema,
    getTransactionsSchema,
    deductUsageSchema,
} from "../schemas";

// Wallet types and services are imported as needed

import {
    getOrCreateWallet,
    topUpWallet,
    getWalletBalance,
    getWalletTransactions,
    deductFromWallet,
} from "../services/wallet-service";

import { BillingAccount, BillingAccountType } from "@/features/billing/types";

/**
 * Wallet API Routes (Wallet-Only Payment Model)
 * 
 * Routes:
 * - GET    /wallet/balance          - Get wallet balance
 * - POST   /wallet/create-order     - Create Razorpay order for wallet top-up
 * - POST   /wallet/verify-topup     - Verify Razorpay payment and credit wallet
 * - GET    /wallet/transactions     - List wallet transactions
 * - POST   /wallet/deduct           - Deduct usage from wallet (internal API)
 * 
 * All endpoints require authentication.
 */

const app = new Hono()
    /**
     * GET /wallet/balance
     * Get wallet balance for current user or organization
     */
    .get(
        "/balance",
        sessionMiddleware,
        zValidator("query", getWalletBalanceSchema),
        async (c) => {
            const user = c.get("user");
            const { userId, organizationId } = c.req.valid("query");

            const { databases } = await createAdminClient();

            const queryUserId = userId || (organizationId ? undefined : user.$id);
            const queryOrgId = organizationId;

            // Get or create wallet
            const wallet = await getOrCreateWallet(databases, {
                userId: queryUserId,
                organizationId: queryOrgId,
            });

            const balance = await getWalletBalance(databases, wallet.$id);

            return c.json({
                data: {
                    walletId: wallet.$id,
                    ...balance,
                    lastTopupAt: wallet.lastTopupAt,
                },
            });
        }
    )

    /**
     * POST /wallet/create-order
     * Create a Razorpay order for wallet top-up
     * 
     * This is step 1 of the top-up flow:
     * 1. Frontend calls this to get a Razorpay order
     * 2. Frontend opens Razorpay Checkout with the order
     * 3. After payment, frontend calls /verify-topup with payment details
     */
    .post(
        "/create-order",
        sessionMiddleware,
        zValidator("json", createTopupOrderSchema),
        async (c) => {
            const user = c.get("user");
            const { amount } = c.req.valid("json");

            const organizationId = c.req.query("organizationId");

            const { databases } = await createAdminClient();

            // Get or create wallet
            const wallet = await getOrCreateWallet(databases, {
                userId: organizationId ? undefined : user.$id,
                organizationId,
            });

            // Fraud check: Daily top-up limit
            // (In production, query wallet_transactions for TOPUP in last 24h)

            // Check daily limit by looking at recent top-up transactions
            // (Simplified — in production, query wallet_transactions for TOPUP in last 24h)
            if (amount > WALLET_DAILY_TOPUP_LIMIT) {
                return c.json({
                    error: "Amount exceeds daily top-up limit",
                    maxAllowed: WALLET_DAILY_TOPUP_LIMIT,
                }, 400);
            }

            // Get billing account for Razorpay customer ID
            let billingAccountId: string | undefined;
            try {
                const billingQuery = organizationId
                    ? [Query.equal("organizationId", organizationId), Query.equal("type", BillingAccountType.ORG)]
                    : [Query.equal("userId", user.$id), Query.equal("type", BillingAccountType.PERSONAL)];

                const accounts = await databases.listDocuments<BillingAccount>(
                    DATABASE_ID,
                    BILLING_ACCOUNTS_ID,
                    [...billingQuery, Query.limit(1)]
                );

                if (accounts.total > 0) {
                    billingAccountId = accounts.documents[0].$id;
                }
            } catch {
                // No billing account found, still allow top-up
            }

            // Create Razorpay order
            const receipt = `topup_${wallet.$id}_${Date.now()}`;
            const order = await createOrder({
                amount,
                currency: BILLING_CURRENCY,
                receipt,
                notes: {
                    fairlx_wallet_id: wallet.$id,
                    fairlx_billing_account_id: billingAccountId || "",
                    fairlx_user_id: user.$id,
                    fairlx_purpose: "wallet_topup",
                },
            });

            return c.json({
                data: {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    key: getPublicKey(),
                    walletId: wallet.$id,
                    prefill: {
                        name: user.name || "",
                        email: user.email,
                    },
                },
            });
        }
    )

    /**
     * POST /wallet/verify-topup
     * Verify Razorpay payment and credit wallet
     * 
     * This is step 3 of the top-up flow:
     * 1. Frontend called /create-order to get an order
     * 2. Frontend completed Razorpay Checkout
     * 3. Frontend calls this with payment details for verification
     */
    .post(
        "/verify-topup",
        sessionMiddleware,
        zValidator("json", verifyTopupSchema),
        async (c) => {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = c.req.valid("json");

            // Step 1: Verify payment signature
            const isValid = verifyPaymentSignature(
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            );

            if (!isValid) {
                return c.json({ error: "Invalid payment signature" }, 400);
            }

            // Step 2: Get payment details from Razorpay
            const { getPayment } = await import("@/lib/razorpay");
            const payment = await getPayment(razorpayPaymentId);

            if (payment.status !== "captured") {
                return c.json({ error: "Payment not captured" }, 400);
            }

            // Step 3: Get wallet from payment notes
            const walletId = (payment.notes as Record<string, string>)?.fairlx_wallet_id;
            if (!walletId) {
                return c.json({ error: "Payment not linked to a wallet" }, 400);
            }

            const { databases } = await createAdminClient();

            // Step 4: Credit wallet (idempotent via payment ID)
            const result = await topUpWallet(databases, walletId, Number(payment.amount), {
                idempotencyKey: `razorpay_${razorpayPaymentId}`,
                paymentId: razorpayPaymentId,
                description: `Wallet top-up via Razorpay (${payment.method})`,
            });

            if (!result.success && result.error !== "already_processed") {
                return c.json({ error: result.error }, 400);
            }

            // Step 5: Return updated balance
            const balance = await getWalletBalance(databases, walletId);

            return c.json({
                data: {
                    success: true,
                    transaction: result.transaction,
                    balance: balance.balance,
                    availableBalance: balance.availableBalance,
                    currency: balance.currency,
                    alreadyProcessed: result.error === "already_processed",
                },
            });
        }
    )

    /**
     * GET /wallet/transactions
     * List wallet transactions
     */
    .get(
        "/transactions",
        sessionMiddleware,
        zValidator("query", getTransactionsSchema),
        async (c) => {
            const user = c.get("user");
            const { limit, offset, type } = c.req.valid("query");

            const organizationId = c.req.query("organizationId");

            const { databases } = await createAdminClient();

            // Get wallet
            const wallet = await getOrCreateWallet(databases, {
                userId: organizationId ? undefined : user.$id,
                organizationId,
            });

            // Get transactions
            const result = await getWalletTransactions(databases, wallet.$id, {
                limit,
                offset,
                type,
            });

            return c.json({
                data: {
                    transactions: result.transactions,
                    total: result.total,
                    walletId: wallet.$id,
                },
            });
        }
    )

    /**
     * POST /wallet/deduct
     * Deduct usage from wallet (internal API — called by other Fairlx services)
     * 
     * CRITICAL: This blocks the action if wallet has insufficient balance.
     * Returns a structured error with an "add_credits" action URI.
     */
    .post(
        "/deduct",
        sessionMiddleware,
        zValidator("json", deductUsageSchema),
        async (c) => {
            const user = c.get("user");
            const { amount, referenceId, idempotencyKey, description } = c.req.valid("json");

            const organizationId = c.req.query("organizationId");

            const { databases } = await createAdminClient();

            // Get wallet
            const wallet = await getOrCreateWallet(databases, {
                userId: organizationId ? undefined : user.$id,
                organizationId,
            });

            // Attempt deduction
            const result = await deductFromWallet(databases, wallet.$id, amount, {
                referenceId,
                idempotencyKey,
                description,
            });

            if (!result.success) {
                // Get current balance for error response
                const balance = await getWalletBalance(databases, wallet.$id);

                return c.json({
                    error: "INSUFFICIENT_BALANCE",
                    message: "Your wallet balance is too low for this action. Please add credits to continue.",
                    currentBalance: balance.balance,
                    requiredAmount: amount,
                    shortfall: amount - balance.availableBalance,
                    action: {
                        type: "ADD_CREDITS",
                        label: "Add Credits",
                        url: `/billing?addCredits=true&amount=${amount}`,
                    },
                }, 402);
            }

            return c.json({
                data: {
                    success: true,
                    transaction: result.transaction,
                },
            });
        }
    );

export default app;
