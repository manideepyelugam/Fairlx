import "server-only";

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";

import {
    topupWalletSchema,
    getWalletBalanceSchema,
    getTransactionsSchema,
} from "../schemas";

import {
    getOrCreateWallet,
    topUpWallet,
    getWalletBalance,
    getWalletTransactions,
} from "../services/wallet-service";

/**
 * Wallet API Routes
 * 
 * Handles wallet operations:
 * - GET /wallet/balance - Get wallet balance
 * - POST /wallet/topup - Top up wallet
 * - GET /wallet/transactions - List transactions
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

            // Determine which entity to query
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
     * POST /wallet/topup
     * Top up wallet balance
     * 
     * IDEMPOTENT: Uses idempotencyKey to prevent duplicate top-ups
     */
    .post(
        "/topup",
        sessionMiddleware,
        zValidator("json", topupWalletSchema),
        async (c) => {
            const user = c.get("user");
            const { amount, idempotencyKey, paymentId } = c.req.valid("json");

            // Get organizationId from query if provided
            const organizationId = c.req.query("organizationId");

            const { databases } = await createAdminClient();

            // Get or create wallet
            const wallet = await getOrCreateWallet(databases, {
                userId: organizationId ? undefined : user.$id,
                organizationId,
            });

            // Process top-up
            const result = await topUpWallet(databases, wallet.$id, amount, {
                idempotencyKey,
                paymentId,
                description: paymentId ? `Top-up via Razorpay (${paymentId})` : "Manual top-up",
            });

            if (!result.success) {
                return c.json({ error: result.error }, 400);
            }

            // Get updated balance
            const balance = await getWalletBalance(databases, wallet.$id);

            return c.json({
                data: {
                    success: true,
                    transaction: result.transaction,
                    balance: balance.balance,
                    availableBalance: balance.availableBalance,
                    currency: balance.currency,
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

            // Get organizationId from query if provided
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
    );

export default app;
