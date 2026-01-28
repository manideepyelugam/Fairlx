import "server-only";

import { Databases, Query } from "node-appwrite";
import { DATABASE_ID, BILLING_ACCOUNTS_ID, USAGE_AGGREGATIONS_ID } from "@/config";
import { BillingAccount } from "@/features/billing/types";
import { billingLog } from "./billing-logger";

/**
 * Rebuild Guards - Safety mechanisms for backfill and rebuild operations
 * 
 * CRITICAL: Future backfill/rebuild scripts MUST use these guards
 * to prevent accidental mutation of finalized billing data.
 * 
 * RULES:
 * 1. usage_events are ALWAYS read-only (immutable ledger)
 * 2. Finalized billing cycles CANNOT be modified
 * 3. Live (current) cycles are protected by default
 * 4. Dry-run mode is enforced for production rebuilds
 */

// ============================================================================
// REBUILD MODE FLAGS
// ============================================================================

/**
 * Global rebuild mode state
 * 
 * When true, certain operations are blocked to protect data.
 */
let _isBackfillMode = false;
let _backfillStartedAt: string | null = null;
let _backfillDryRun = true; // Default to dry-run for safety

/**
 * Check if currently in backfill/rebuild mode
 */
export function isBackfillMode(): boolean {
    return _isBackfillMode;
}

/**
 * Get backfill mode status
 */
export function getBackfillStatus(): {
    active: boolean;
    startedAt: string | null;
    isDryRun: boolean;
} {
    return {
        active: _isBackfillMode,
        startedAt: _backfillStartedAt,
        isDryRun: _backfillDryRun,
    };
}

/**
 * Enter backfill mode
 * 
 * @param options.dryRun - If true (default), no writes are performed
 * @param options.force - If true, allows entering without dry-run in production
 */
export function enterBackfillMode(options: {
    dryRun?: boolean;
    force?: boolean;
} = {}): void {
    const isDryRun = options.dryRun ?? true;
    const isProduction = process.env.NODE_ENV === "production";

    // Safety: Require explicit force flag to run non-dry-run in production
    if (isProduction && !isDryRun && !options.force) {
        throw new Error(
            "REBUILD_SAFETY: Cannot run non-dry-run rebuild in production without force=true"
        );
    }

    _isBackfillMode = true;
    _backfillStartedAt = new Date().toISOString();
    _backfillDryRun = isDryRun;

    billingLog.info("REBUILD", "Entered backfill mode", {
        startedAt: _backfillStartedAt,
        isDryRun,
        environment: process.env.NODE_ENV,
    });
}

/**
 * Exit backfill mode
 */
export function exitBackfillMode(): void {
    billingLog.info("REBUILD", "Exiting backfill mode", {
        startedAt: _backfillStartedAt,
        duration: _backfillStartedAt
            ? `${(Date.now() - new Date(_backfillStartedAt).getTime()) / 1000}s`
            : "unknown",
    });

    _isBackfillMode = false;
    _backfillStartedAt = null;
    _backfillDryRun = true;
}

// ============================================================================
// REBUILD GUARDS
// ============================================================================

/**
 * Guard error for rebuild violations
 */
export class RebuildGuardError extends Error {
    guard: string;
    context?: Record<string, unknown>;

    constructor(guard: string, message: string, context?: Record<string, unknown>) {
        super(`REBUILD_GUARD [${guard}]: ${message}`);
        this.name = "RebuildGuardError";
        this.guard = guard;
        this.context = context;
    }
}

/**
 * Assert that a rebuild operation can proceed
 * 
 * Checks:
 * 1. Not attempting to modify a live (current) billing cycle
 * 2. Not attempting to modify a finalized period
 * 
 * @throws RebuildGuardError if rebuild would violate safety rules
 */
export async function assertCanRebuild(
    databases: Databases,
    options: {
        billingAccountId?: string;
        period?: string; // YYYY-MM format
        targetCycleEnd?: string;
    }
): Promise<void> {
    const { billingAccountId, period, targetCycleEnd } = options;

    // If we have a billing account, check cycle state
    if (billingAccountId) {
        try {
            const account = await databases.getDocument<BillingAccount>(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                billingAccountId
            );

            const now = new Date();
            const cycleEnd = new Date(account.billingCycleEnd);

            // Block if targeting current live cycle
            if (now < cycleEnd) {
                // Check if the target is within the current cycle
                if (targetCycleEnd) {
                    const targetEnd = new Date(targetCycleEnd);
                    if (targetEnd >= new Date(account.billingCycleStart) && targetEnd <= cycleEnd) {
                        throw new RebuildGuardError(
                            "LIVE_CYCLE",
                            "Cannot rebuild data within the current live billing cycle",
                            {
                                billingAccountId,
                                currentCycleStart: account.billingCycleStart,
                                currentCycleEnd: account.billingCycleEnd,
                                targetCycleEnd,
                            }
                        );
                    }
                }
            }

            // Block if cycle is locked (invoice being generated)
            if (account.isBillingCycleLocked) {
                throw new RebuildGuardError(
                    "LOCKED_CYCLE",
                    "Cannot rebuild data for a locked billing cycle",
                    {
                        billingAccountId,
                        lockedAt: account.billingCycleLockedAt,
                    }
                );
            }
        } catch (error) {
            if (error instanceof RebuildGuardError) {
                throw error;
            }
            // Document not found is OK - no billing account yet
        }
    }

    // If we have a period, check if any aggregations are finalized
    if (period) {
        try {
            const aggregations = await databases.listDocuments(
                DATABASE_ID,
                USAGE_AGGREGATIONS_ID,
                [
                    Query.equal("period", period),
                    Query.equal("isFinalized", true),
                    Query.limit(1),
                ]
            );

            if (aggregations.total > 0) {
                throw new RebuildGuardError(
                    "FINALIZED_PERIOD",
                    "Cannot rebuild data for a finalized (invoiced) period",
                    {
                        period,
                        finalizedAggregationId: aggregations.documents[0].$id,
                        finalizedAt: aggregations.documents[0].finalizedAt,
                    }
                );
            }
        } catch (error) {
            if (error instanceof RebuildGuardError) {
                throw error;
            }
            // Query error - don't block
        }
    }

    billingLog.info("REBUILD", "Rebuild guard passed", { billingAccountId, period });
}

/**
 * Assert usage_events are read-only during rebuild
 * 
 * This guard should be called before ANY write to usage_events.
 * During backfill mode, it will block writes to enforce immutability.
 * 
 * @throws RebuildGuardError if attempting to write during rebuild
 */
export function assertReadOnlyDuringRebuild(): void {
    if (_isBackfillMode) {
        throw new RebuildGuardError(
            "USAGE_IMMUTABLE",
            "usage_events are read-only during backfill/rebuild operations",
            {
                backfillStartedAt: _backfillStartedAt,
                isDryRun: _backfillDryRun,
            }
        );
    }
}

/**
 * Assert not in backfill mode for critical operations
 * 
 * Some operations (like invoice generation) should not run during backfill.
 */
export function assertNotInBackfillMode(operation: string): void {
    if (_isBackfillMode) {
        throw new RebuildGuardError(
            "BACKFILL_ACTIVE",
            `Operation '${operation}' cannot run during backfill mode`,
            {
                operation,
                backfillStartedAt: _backfillStartedAt,
            }
        );
    }
}

/**
 * Check if we should perform a write or just log (dry-run mode)
 * 
 * @returns true if write should proceed, false if dry-run
 */
export function shouldPerformWrite(): boolean {
    if (!_isBackfillMode) {
        return true; // Normal mode, writes allowed
    }
    return !_backfillDryRun;
}

/**
 * Wrapper for write operations in rebuild scripts
 * 
 * In dry-run mode, logs the operation instead of executing.
 */
export async function rebuildWrite<T>(
    description: string,
    writeOperation: () => Promise<T>
): Promise<T | null> {
    if (!shouldPerformWrite()) {
        billingLog.info("REBUILD_DRY_RUN", `Would execute: ${description}`);
        return null;
    }

    billingLog.info("REBUILD", `Executing: ${description}`);
    return writeOperation();
}
