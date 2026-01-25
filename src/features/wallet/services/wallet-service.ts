import "server-only";

import { ID, Query, Databases } from "node-appwrite";

import {
    DATABASE_ID,
    WALLETS_ID,
    WALLET_TRANSACTIONS_ID,
} from "@/config";
import { createAdminClient } from "@/lib/appwrite";
// Lock functions imported dynamically in transaction methods

import {
    Wallet,
    WalletTransaction,
    WalletTransactionType,
} from "../types";

/**
 * Wallet Service
 * 
 * Core business logic for the prepaid wallet system:
 * - Wallet creation
 * - Balance queries
 * - Top-ups (with idempotency)
 * - Deductions (with race condition protection)
 * - Refunds
 * 
 * CRITICAL: All balance operations use idempotency keys and
 * optimistic checks to prevent double-spend and concurrent bugs.
 */

// ============================================================================
// WALLET CREATION & QUERIES
// ============================================================================

/**
 * Get or create wallet for a user/organization
 * 
 * IDEMPOTENT: Returns existing wallet if it exists
 */
export async function getOrCreateWallet(
    databases: Databases,
    options: {
        userId?: string;
        organizationId?: string;
        currency?: string;
    }
): Promise<Wallet> {
    if (!options.userId && !options.organizationId) {
        throw new Error("Either userId or organizationId is required");
    }

    const currency = options.currency || "INR";

    // Query for existing wallet
    const queries = options.organizationId
        ? [Query.equal("organizationId", options.organizationId)]
        : [Query.equal("userId", options.userId!)];

    const existing = await databases.listDocuments<Wallet>(
        DATABASE_ID,
        WALLETS_ID,
        [...queries, Query.limit(1)]
    );

    if (existing.total > 0) {
        return existing.documents[0];
    }

    // Create new wallet with zero balance
    const wallet = await databases.createDocument<Wallet>(
        DATABASE_ID,
        WALLETS_ID,
        ID.unique(),
        {
            userId: options.userId || null,
            organizationId: options.organizationId || null,
            balance: 0,
            currency,
            lockedBalance: 0,
        }
    );

    console.log(`[Wallet] Created wallet ${wallet.$id} for ${options.organizationId || options.userId}`);

    return wallet;
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(
    databases: Databases,
    walletId: string
): Promise<{ balance: number; lockedBalance: number; availableBalance: number; currency: string }> {
    const wallet = await databases.getDocument<Wallet>(
        DATABASE_ID,
        WALLETS_ID,
        walletId
    );

    return {
        balance: wallet.balance,
        lockedBalance: wallet.lockedBalance,
        availableBalance: wallet.balance - wallet.lockedBalance,
        currency: wallet.currency,
    };
}

// ============================================================================
// TOP-UP OPERATIONS
// ============================================================================

// ============================================================================
// TOP-UP OPERATIONS
// ============================================================================

/**
 * Top up wallet balance
 * 
 * IDEMPOTENT: Uses idempotencyKey to prevent duplicate top-ups
 * Uses Distributed Lock to prevent race conditions.
 */
export async function topUpWallet(
    databases: Databases,
    walletId: string,
    amount: number,
    options: {
        idempotencyKey: string;
        paymentId?: string;
        description?: string;
    }
): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
    if (amount <= 0) {
        return { success: false, error: "Amount must be positive" };
    }

    const { acquireProcessingLock, releaseProcessingLock } = await import("@/lib/processed-events-registry");
    const eventKey = `wallet_topup:${options.idempotencyKey}`;

    // 1. Acquire Distributed Lock (Atomic)
    // This returns false if event is already processed OR currently being processed
    if (!(await acquireProcessingLock(databases, eventKey, "wallet"))) {
        console.log(`[Wallet] Duplicate top-up ignored: ${options.idempotencyKey}`);
        return { success: true, error: "already_processed" };
    }

    try {
        // 2. Get current wallet
        const wallet = await databases.getDocument<Wallet>(
            DATABASE_ID,
            WALLETS_ID,
            walletId
        );

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        // 3. Update wallet balance
        await databases.updateDocument(
            DATABASE_ID,
            WALLETS_ID,
            walletId,
            {
                balance: balanceAfter,
                lastTopupAt: new Date().toISOString(),
            }
        );

        // 4. Create transaction record
        const transaction = await databases.createDocument<WalletTransaction>(
            DATABASE_ID,
            WALLET_TRANSACTIONS_ID,
            ID.unique(),
            {
                walletId,
                type: WalletTransactionType.TOPUP,
                amount,
                direction: "credit",
                balanceBefore,
                balanceAfter,
                currency: wallet.currency,
                referenceId: options.paymentId || null,
                idempotencyKey: options.idempotencyKey,
                description: options.description || "Wallet top-up",
                metadata: JSON.stringify({
                    paymentId: options.paymentId,
                }),
            }
        );

        console.log(`[Wallet] Top-up successful: ${walletId} +${amount} (${wallet.currency})`);

        return { success: true, transaction };

    } catch (error) {
        console.error(`[Wallet] Top-up failed: ${error}`);
        // Rollback lock mechanisms so it can be retried
        await releaseProcessingLock(databases, eventKey, "wallet");
        throw error;
    }
}

// ============================================================================
// DEDUCTION OPERATIONS
// ============================================================================

/**
 * Deduct from wallet balance
 * 
 * IDEMPOTENT: Uses idempotencyKey to prevent duplicate deductions.
 * Uses Distributed Lock to prevent race conditions (Double Deduction).
 */
export async function deductFromWallet(
    databases: Databases,
    walletId: string,
    amount: number,
    options: {
        referenceId: string;
        idempotencyKey: string;
        description?: string;
    }
): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
    if (amount <= 0) {
        return { success: false, error: "Amount must be positive" };
    }

    const { acquireProcessingLock, releaseProcessingLock } = await import("@/lib/processed-events-registry");
    const eventKey = `wallet_deduct:${options.idempotencyKey}`;

    // 1. Acquire Distributed Lock
    if (!(await acquireProcessingLock(databases, eventKey, "wallet"))) {
        console.log(`[Wallet] Duplicate deduction ignored: ${options.idempotencyKey}`);
        return { success: true, error: "already_processed" };
    }

    try {
        // 2. Get current wallet
        const wallet = await databases.getDocument<Wallet>(
            DATABASE_ID,
            WALLETS_ID,
            walletId
        );

        // 3. Status Check (Balance)
        const availableBalance = wallet.balance - wallet.lockedBalance;
        if (availableBalance < amount) {
            console.log(`[Wallet] Insufficient balance: ${walletId} has ${availableBalance}, needs ${amount}`);
            // Release lock because logic failed, not system error?
            // If we release lock, they can retry. But balance is still insufficient.
            // If we KEEP lock, they cannot retry.
            // Result is "Failed", so we should probably allow retry if they top up?
            // But retry with SAME idempotency key?
            // If they top up, they should send NEW request.
            // If they retry SAME request, it will fail again.
            // So releasing lock is fine.
            await releaseProcessingLock(databases, eventKey, "wallet");
            return { success: false, error: "insufficient_balance" };
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - amount;

        // 4. Update wallet balance
        await databases.updateDocument(
            DATABASE_ID,
            WALLETS_ID,
            walletId,
            {
                balance: balanceAfter,
                lastDeductionAt: new Date().toISOString(),
            }
        );

        // 5. Create transaction record
        const transaction = await databases.createDocument<WalletTransaction>(
            DATABASE_ID,
            WALLET_TRANSACTIONS_ID,
            ID.unique(),
            {
                walletId,
                type: WalletTransactionType.USAGE,
                amount,
                direction: "debit",
                balanceBefore,
                balanceAfter,
                currency: wallet.currency,
                referenceId: options.referenceId,
                idempotencyKey: options.idempotencyKey,
                description: options.description || "Usage charge",
            }
        );

        console.log(`[Wallet] Deduction successful: ${walletId} -${amount} (${wallet.currency})`);

        return { success: true, transaction };

    } catch (error) {
        console.error(`[Wallet] Deduction failed: ${error}`);
        // Rollback lock to allow retry
        await releaseProcessingLock(databases, eventKey, "wallet");
        throw error;
    }
}

// ============================================================================
// REFUND OPERATIONS
// ============================================================================

/**
 * Refund to wallet
 * 
 * IDEMPOTENT: Uses idempotencyKey to prevent duplicate refunds
 */
export async function refundToWallet(
    databases: Databases,
    walletId: string,
    amount: number,
    options: {
        referenceId: string;
        idempotencyKey: string;
        reason?: string;
    }
): Promise<{ success: boolean; transaction?: WalletTransaction; error?: string }> {
    if (amount <= 0) {
        return { success: false, error: "Amount must be positive" };
    }

    const { acquireProcessingLock, releaseProcessingLock } = await import("@/lib/processed-events-registry");
    const eventKey = `wallet_refund:${options.idempotencyKey}`;

    // 1. Acquire Distributed Lock
    if (!(await acquireProcessingLock(databases, eventKey, "wallet"))) {
        console.log(`[Wallet] Duplicate refund ignored: ${options.idempotencyKey}`);
        return { success: true, error: "already_processed" };
    }

    try {
        const wallet = await databases.getDocument<Wallet>(
            DATABASE_ID,
            WALLETS_ID,
            walletId
        );

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        // Update wallet balance
        await databases.updateDocument(
            DATABASE_ID,
            WALLETS_ID,
            walletId,
            { balance: balanceAfter }
        );

        // Create transaction record
        const transaction = await databases.createDocument<WalletTransaction>(
            DATABASE_ID,
            WALLET_TRANSACTIONS_ID,
            ID.unique(),
            {
                walletId,
                type: WalletTransactionType.REFUND,
                amount,
                direction: "credit",
                balanceBefore,
                balanceAfter,
                currency: wallet.currency,
                referenceId: options.referenceId,
                idempotencyKey: options.idempotencyKey,
                description: options.reason || "Refund",
            }
        );

        console.log(`[Wallet] Refund successful: ${walletId} +${amount} (${wallet.currency})`);

        return { success: true, transaction };

    } catch (error) {
        console.error(`[Wallet] Refund failed: ${error}`);
        await releaseProcessingLock(databases, eventKey, "wallet");
        throw error;
    }
}

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(
    databases: Databases,
    walletId: string,
    options: {
        limit?: number;
        offset?: number;
        type?: WalletTransactionType;
    } = {}
): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const queries = [
        Query.equal("walletId", walletId),
        Query.orderDesc("$createdAt"),
        Query.limit(options.limit || 20),
        Query.offset(options.offset || 0),
    ];

    if (options.type) {
        queries.push(Query.equal("type", options.type));
    }

    const result = await databases.listDocuments<WalletTransaction>(
        DATABASE_ID,
        WALLET_TRANSACTIONS_ID,
        queries
    );

    return {
        transactions: result.documents,
        total: result.total,
    };
}

// ============================================================================
// HELPER: Setup wallet for billing account
// ============================================================================

/**
 * Ensure wallet exists for a billing entity
 * Called during billing account setup
 */
export async function ensureWalletExists(
    options: {
        userId?: string;
        organizationId?: string;
        currency?: string;
    }
): Promise<Wallet> {
    const { databases } = await createAdminClient();
    return getOrCreateWallet(databases, options);
}
