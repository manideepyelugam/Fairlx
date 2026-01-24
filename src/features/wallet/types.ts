import { Models } from "node-appwrite";

// ===============================
// Wallet Transaction Types
// ===============================

/**
 * WalletTransactionType - tracks type of wallet transaction
 * 
 * TOPUP: Funds added to wallet (via Razorpay payment)
 * USAGE: Funds deducted for billing usage
 * REFUND: Funds returned (e.g., service credit)
 * ADJUSTMENT: Manual adjustment by admin
 */
export enum WalletTransactionType {
    TOPUP = "TOPUP",
    USAGE = "USAGE",
    REFUND = "REFUND",
    ADJUSTMENT = "ADJUSTMENT",
}

// ===============================
// Billing Mode Enum
// ===============================

/**
 * BillingMode - determines how usage is charged
 * 
 * AUTOPAY: Always charge payment method (mandate/UPI/card)
 * PREPAID: Wallet only, block usage if insufficient balance
 * HYBRID: Wallet first, fallback to autopay if insufficient
 */
export enum BillingMode {
    AUTOPAY = "autopay",
    PREPAID = "prepaid",
    HYBRID = "hybrid",
}

// ===============================
// Database Document Types
// ===============================

/**
 * Wallet - User's prepaid balance
 * 
 * Each user/org has exactly one wallet.
 * Balance is stored in smallest currency unit (paise for INR).
 * 
 * INVARIANT: balance >= 0 (never negative)
 * INVARIANT: lockedBalance <= balance
 */
export type Wallet = Models.Document & {
    /** User ID (for PERSONAL accounts) */
    userId?: string;

    /** Organization ID (for ORG accounts) */
    organizationId?: string;

    /** Available balance in smallest currency unit (paise) */
    balance: number;

    /** Currency code (INR, USD) */
    currency: string;

    /** Balance reserved for pending transactions */
    lockedBalance: number;

    /** Last top-up timestamp */
    lastTopupAt?: string;

    /** Last deduction timestamp */
    lastDeductionAt?: string;
};

/**
 * WalletTransaction - Ledger entry for wallet operations
 * 
 * IMMUTABLE: Transactions are append-only, never modified.
 * This ensures audit trail and ledger consistency.
 */
export type WalletTransaction = Models.Document & {
    /** Reference to Wallet */
    walletId: string;

    /** Transaction type */
    type: WalletTransactionType;

    /** Amount (always positive, direction determines credit/debit) */
    amount: number;

    /** Direction: credit (increase) or debit (decrease) */
    direction: "credit" | "debit";

    /** Balance before this transaction */
    balanceBefore: number;

    /** Balance after this transaction */
    balanceAfter: number;

    /** Currency code */
    currency: string;

    /** Reference ID (invoice ID, order ID, etc.) */
    referenceId?: string;

    /** Idempotency key for replay protection */
    idempotencyKey?: string;

    /** Additional metadata (JSON stringified) */
    metadata?: string;

    /** Description for display */
    description?: string;
};

/**
 * BillingSettings - User preferences for billing mode
 */
export type BillingSetting = Models.Document & {
    /** User ID (for PERSONAL accounts) */
    userId?: string;

    /** Organization ID (for ORG accounts) */
    organizationId?: string;

    /** Current billing mode */
    billingMode: BillingMode;

    /** Enable auto top-up when balance is low */
    autoTopupEnabled?: boolean;

    /** Balance threshold for auto top-up (in paise) */
    autoTopupThreshold?: number;

    /** Amount to add on auto top-up (in paise) */
    autoTopupAmount?: number;

    /** Minimum balance warning threshold (in paise) */
    lowBalanceWarningThreshold?: number;
};

// ===============================
// API DTOs
// ===============================

export type TopupWalletDto = {
    amount: number;
    idempotencyKey: string;
    paymentId?: string;
};

export type DeductWalletDto = {
    amount: number;
    referenceId: string;
    idempotencyKey: string;
    description?: string;
};

export type WalletBalanceResponse = {
    balance: number;
    lockedBalance: number;
    availableBalance: number;
    currency: string;
    lastTopupAt?: string;
};

export type SetBillingModeDto = {
    billingMode: BillingMode;
};
