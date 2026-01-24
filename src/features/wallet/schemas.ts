import { z } from "zod";
import { WalletTransactionType, BillingMode } from "./types";

// ===============================
// Wallet Validation Schemas
// ===============================

/**
 * Schema for wallet top-up
 * Requires idempotency key to prevent duplicate top-ups
 */
export const topupWalletSchema = z.object({
    /** Amount in smallest currency unit (paise). Min ₹1, Max ₹1,00,000 */
    amount: z.number().min(100, "Minimum top-up is ₹1").max(10000000, "Maximum top-up is ₹1,00,000"),
    /** Unique key to prevent duplicate processing */
    idempotencyKey: z.string().min(1).max(64),
    /** Optional Razorpay payment ID for verification */
    paymentId: z.string().optional(),
});

export type TopupWalletInput = z.infer<typeof topupWalletSchema>;

/**
 * Schema for getting wallet balance
 */
export const getWalletBalanceSchema = z.object({
    userId: z.string().optional(),
    organizationId: z.string().optional(),
}).refine(
    (data) => data.userId || data.organizationId,
    { message: "Either userId or organizationId is required" }
);

export type GetWalletBalanceInput = z.infer<typeof getWalletBalanceSchema>;

/**
 * Schema for listing wallet transactions
 */
export const getTransactionsSchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
    type: z.nativeEnum(WalletTransactionType).optional(),
});

export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>;

/**
 * Schema for setting billing mode
 */
export const setBillingModeSchema = z.object({
    billingMode: z.nativeEnum(BillingMode),
});

export type SetBillingModeInput = z.infer<typeof setBillingModeSchema>;

/**
 * Schema for consuming usage (internal use)
 * Used by billing cycle to deduct from wallet
 */
export const consumeUsageSchema = z.object({
    /** Amount to consume in smallest currency unit (paise) */
    amount: z.number().min(1),
    /** Invoice ID for reference */
    invoiceId: z.string().min(1),
    /** Idempotency key to prevent double-deduction */
    idempotencyKey: z.string().min(1).max(64),
});

export type ConsumeUsageInput = z.infer<typeof consumeUsageSchema>;

/**
 * Schema for wallet refund (internal use)
 */
export const refundWalletSchema = z.object({
    amount: z.number().min(1),
    referenceId: z.string().min(1),
    idempotencyKey: z.string().min(1).max(64),
    reason: z.string().optional(),
});

export type RefundWalletInput = z.infer<typeof refundWalletSchema>;
