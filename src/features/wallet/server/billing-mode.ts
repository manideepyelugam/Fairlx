import "server-only";

import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import {
    DATABASE_ID,
    BILLING_SETTINGS_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";

import { setBillingModeSchema, consumeUsageSchema } from "../schemas";
import { BillingSetting, BillingMode } from "../types";
import { deductFromWallet, getOrCreateWallet } from "../services/wallet-service";

/**
 * Billing Mode API Routes
 * 
 * Handles billing mode operations:
 * - GET /billing-mode - Get current billing mode
 * - PUT /billing-mode - Set billing mode
 * - POST /billing-mode/consume - Consume usage (wallet-aware)
 */

const app = new Hono()
    /**
     * GET /billing-mode
     * Get current billing mode for user/organization
     */
    .get(
        "/",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const organizationId = c.req.query("organizationId");

            const { databases } = await createAdminClient();

            // Query for billing settings
            const queries = organizationId
                ? [Query.equal("organizationId", organizationId)]
                : [Query.equal("userId", user.$id)];

            const settings = await databases.listDocuments<BillingSetting>(
                DATABASE_ID,
                BILLING_SETTINGS_ID,
                [...queries, Query.limit(1)]
            );

            if (settings.total === 0) {
                // Return default mode
                return c.json({
                    data: {
                        billingMode: BillingMode.AUTOPAY,
                        isDefault: true,
                    },
                });
            }

            return c.json({
                data: {
                    billingMode: settings.documents[0].billingMode,
                    autoTopupEnabled: settings.documents[0].autoTopupEnabled,
                    autoTopupThreshold: settings.documents[0].autoTopupThreshold,
                    autoTopupAmount: settings.documents[0].autoTopupAmount,
                    isDefault: false,
                },
            });
        }
    )

    /**
     * PUT /billing-mode
     * Set billing mode
     */
    .put(
        "/",
        sessionMiddleware,
        zValidator("json", setBillingModeSchema),
        async (c) => {
            const user = c.get("user");
            const { billingMode } = c.req.valid("json");
            const organizationId = c.req.query("organizationId");

            const { databases } = await createAdminClient();

            // Query for existing settings
            const queries = organizationId
                ? [Query.equal("organizationId", organizationId)]
                : [Query.equal("userId", user.$id)];

            const existing = await databases.listDocuments<BillingSetting>(
                DATABASE_ID,
                BILLING_SETTINGS_ID,
                [...queries, Query.limit(1)]
            );

            let settings: BillingSetting;

            if (existing.total > 0) {
                // Update existing
                settings = await databases.updateDocument<BillingSetting>(
                    DATABASE_ID,
                    BILLING_SETTINGS_ID,
                    existing.documents[0].$id,
                    { billingMode }
                );
            } else {
                // Create new
                settings = await databases.createDocument<BillingSetting>(
                    DATABASE_ID,
                    BILLING_SETTINGS_ID,
                    ID.unique(),
                    {
                        userId: organizationId ? null : user.$id,
                        organizationId: organizationId || null,
                        billingMode,
                    }
                );
            }

            console.log(`[BillingMode] Set to ${billingMode} for ${organizationId || user.$id}`);

            return c.json({
                data: {
                    billingMode: settings.billingMode,
                    success: true,
                },
            });
        }
    )

    /**
     * POST /billing-mode/consume
     * Consume usage amount (wallet-aware)
     * 
     * BILLING MODE LOGIC:
     * - AUTOPAY: Skip wallet, charge payment method
     * - PREPAID: Wallet only, fail if insufficient
     * - HYBRID: Wallet first, fallback to autopay for remainder
     * 
     * Returns consumption result for billing cycle processing
     */
    .post(
        "/consume",
        sessionMiddleware,
        zValidator("json", consumeUsageSchema),
        async (c) => {
            const user = c.get("user");
            const { amount, invoiceId, idempotencyKey } = c.req.valid("json");
            const organizationId = c.req.query("organizationId");

            const { databases } = await createAdminClient();

            // Get billing mode
            const settingsQueries = organizationId
                ? [Query.equal("organizationId", organizationId)]
                : [Query.equal("userId", user.$id)];

            const settings = await databases.listDocuments<BillingSetting>(
                DATABASE_ID,
                BILLING_SETTINGS_ID,
                [...settingsQueries, Query.limit(1)]
            );

            const billingMode = settings.total > 0
                ? settings.documents[0].billingMode
                : BillingMode.AUTOPAY;

            // For AUTOPAY mode, skip wallet entirely
            if (billingMode === BillingMode.AUTOPAY) {
                return c.json({
                    data: {
                        walletDeducted: 0,
                        remainingAmount: amount,
                        useAutopay: true,
                        billingMode,
                    },
                });
            }

            // Get wallet
            const wallet = await getOrCreateWallet(databases, {
                userId: organizationId ? undefined : user.$id,
                organizationId,
            });

            const availableBalance = wallet.balance - wallet.lockedBalance;

            // Calculate how much to deduct from wallet
            const walletDeductAmount = Math.min(amount, availableBalance);
            const remainingAmount = amount - walletDeductAmount;

            // Deduct from wallet if there's something to deduct
            let walletTransaction = null;
            if (walletDeductAmount > 0) {
                const result = await deductFromWallet(databases, wallet.$id, walletDeductAmount, {
                    referenceId: invoiceId,
                    idempotencyKey,
                    description: `Invoice ${invoiceId}`,
                });

                if (result.success && result.transaction) {
                    walletTransaction = result.transaction;
                }
            }

            // For PREPAID mode, fail if insufficient
            if (billingMode === BillingMode.PREPAID && remainingAmount > 0) {
                return c.json({
                    data: {
                        walletDeducted: walletDeductAmount,
                        remainingAmount,
                        useAutopay: false,
                        billingMode,
                        insufficientBalance: true,
                        transaction: walletTransaction,
                    },
                });
            }

            // For HYBRID mode, use autopay for remainder
            return c.json({
                data: {
                    walletDeducted: walletDeductAmount,
                    remainingAmount,
                    useAutopay: remainingAmount > 0,
                    billingMode,
                    transaction: walletTransaction,
                },
            });
        }
    );

export default app;
