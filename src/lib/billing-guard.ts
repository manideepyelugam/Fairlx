import "server-only";

import { createMiddleware } from "hono/factory";
import { Query, Databases } from "node-appwrite";
import { DATABASE_ID, BILLING_ACCOUNTS_ID, WORKSPACES_ID } from "@/config";
import { BillingStatus, BillingAccountType } from "@/features/billing/types";

/**
 * Billing Guard Middleware
 * 
 * CRITICAL: This middleware enforces billing status on every protected request.
 * 
 * BEHAVIOR:
 * - ACTIVE: Allow all operations, no warnings
 * - DUE: Allow all operations, inject warning header
 * - SUSPENDED: Block all except billing routes, return 403
 * 
 * INTEGRATION:
 * - Runs after session middleware (needs user context)
 * - Must check billing status for both PERSONAL and ORG accounts
 * - Cached per request to avoid redundant DB queries
 */

type BillingGuardContext = {
    Variables: {
        databases?: Databases;
        user?: { $id: string; prefs?: { accountType?: string; primaryOrgId?: string } };
        billingStatus?: BillingStatus;
        billingAccountId?: string;
    };
};

// Routes that are always accessible, even when suspended
const BILLING_EXEMPT_PATHS = [
    "/api/billing",
    "/billing",
    "/api/webhooks",
    "/api/auth",
    "/api/users/current", // Need to check user status
];

// Routes that are explicitly blocked when suspended (most routes)
// We use an allowlist approach - only billing routes are allowed

/**
 * Check if a path is exempt from billing enforcement
 */
function isExemptPath(path: string): boolean {
    return BILLING_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt));
}

/**
 * Get billing status for a user
 * 
 * Determines which billing account applies:
 * - ORG account: Check organization's billing account
 * - PERSONAL account: Check user's billing account
 */
async function getBillingStatusForUser(
    databases: Databases,
    userId: string,
    accountType?: string,
    primaryOrgId?: string
): Promise<{ status: BillingStatus; accountId?: string; daysUntilSuspension?: number }> {
    try {
        // Determine billing entity based on account type
        if (accountType === "ORG" && primaryOrgId) {
            // ORG account - check organization's billing
            const billingAccounts = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [
                    Query.equal("organizationId", primaryOrgId),
                    Query.equal("type", BillingAccountType.ORG),
                    Query.limit(1),
                ]
            );

            if (billingAccounts.total > 0) {
                const account = billingAccounts.documents[0];
                const status = account.billingStatus as BillingStatus;
                let daysUntilSuspension: number | undefined;

                if (status === BillingStatus.DUE && account.gracePeriodEnd) {
                    const gracePeriodEnd = new Date(account.gracePeriodEnd);
                    const now = new Date();
                    daysUntilSuspension = Math.max(
                        0,
                        Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    );
                }

                return { status, accountId: account.$id, daysUntilSuspension };
            }

            // No billing account for org - treat as ACTIVE (new org, hasn't set up billing yet)
            return { status: BillingStatus.ACTIVE };
        }

        // PERSONAL account - check user's billing
        const billingAccounts = await databases.listDocuments(
            DATABASE_ID,
            BILLING_ACCOUNTS_ID,
            [
                Query.equal("userId", userId),
                Query.equal("type", BillingAccountType.PERSONAL),
                Query.limit(1),
            ]
        );

        if (billingAccounts.total > 0) {
            const account = billingAccounts.documents[0];
            const status = account.billingStatus as BillingStatus;
            let daysUntilSuspension: number | undefined;

            if (status === BillingStatus.DUE && account.gracePeriodEnd) {
                const gracePeriodEnd = new Date(account.gracePeriodEnd);
                const now = new Date();
                daysUntilSuspension = Math.max(
                    0,
                    Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                );
            }

            return { status, accountId: account.$id, daysUntilSuspension };
        }

        // No billing account - treat as ACTIVE (hasn't set up billing yet)
        return { status: BillingStatus.ACTIVE };
    } catch {
        // FAIL OPEN: If we can't check, allow access (billing issues shouldn't block users completely)
        // This is a tradeoff - should monitor for patterns
        return { status: BillingStatus.ACTIVE };
    }
}

/**
 * Get billing status for a workspace
 * 
 * Used when request is scoped to a specific workspace.
 * Determines if the workspace belongs to an org or personal account.
 */
async function getBillingStatusForWorkspace(
    databases: Databases,
    workspaceId: string
): Promise<{ status: BillingStatus; accountId?: string; daysUntilSuspension?: number }> {
    try {
        // Get workspace to determine owner
        const workspace = await databases.getDocument(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId
        );

        if (workspace.organizationId) {
            // Workspace belongs to an organization
            const billingAccounts = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [
                    Query.equal("organizationId", workspace.organizationId),
                    Query.equal("type", BillingAccountType.ORG),
                    Query.limit(1),
                ]
            );

            if (billingAccounts.total > 0) {
                const account = billingAccounts.documents[0];
                return {
                    status: account.billingStatus as BillingStatus,
                    accountId: account.$id
                };
            }
        } else if (workspace.userId) {
            // Personal workspace
            const billingAccounts = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [
                    Query.equal("userId", workspace.userId),
                    Query.equal("type", BillingAccountType.PERSONAL),
                    Query.limit(1),
                ]
            );

            if (billingAccounts.total > 0) {
                const account = billingAccounts.documents[0];
                return {
                    status: account.billingStatus as BillingStatus,
                    accountId: account.$id
                };
            }
        }

        // No billing account - treat as ACTIVE
        return { status: BillingStatus.ACTIVE };
    } catch {
        return { status: BillingStatus.ACTIVE };
    }
}

/**
 * Billing Guard Middleware
 * 
 * USAGE:
 * Add to Hono routes after session middleware:
 * 
 * ```typescript
 * app.use("*", sessionMiddleware, billingGuard);
 * ```
 */
export const billingGuard = createMiddleware<BillingGuardContext>(async (c, next) => {
    const path = c.req.path;

    // Skip billing check for exempt paths
    if (isExemptPath(path)) {
        await next();
        return;
    }

    // Get user and databases from context
    const user = c.get("user");
    const databases = c.get("databases");

    // No user = not authenticated, let auth middleware handle it
    if (!user || !databases) {
        await next();
        return;
    }

    // Check billing status
    // User prefs contain accountType and primaryOrgId (set during onboarding)
    const accountType = user.prefs?.accountType;
    const primaryOrgId = user.prefs?.primaryOrgId;

    const { status, accountId, daysUntilSuspension } = await getBillingStatusForUser(
        databases,
        user.$id,
        accountType,
        primaryOrgId
    );

    // Store in context for downstream use
    c.set("billingStatus", status);
    if (accountId) {
        c.set("billingAccountId", accountId);
    }

    // Handle based on status
    switch (status) {
        case BillingStatus.ACTIVE:
            // All good, proceed
            await next();
            break;

        case BillingStatus.DUE:
            // Allow access but add warning headers
            c.header("X-Billing-Status", "DUE");
            if (daysUntilSuspension !== undefined) {
                c.header("X-Billing-Days-Until-Suspension", daysUntilSuspension.toString());
            }
            await next();
            break;

        case BillingStatus.SUSPENDED:
            // Block access with 403 and clear message
            return c.json(
                {
                    error: "ACCOUNT_SUSPENDED",
                    message: "Your account has been suspended due to an unpaid invoice. Please add credits to your wallet to restore access.",
                    billingUrl: "/billing",
                    code: "BILLING_SUSPENDED",
                },
                403
            );

        default:
            // Unknown status, allow access (fail open)
            await next();
    }
});

/**
 * Lightweight billing status check (for client-side awareness)
 * 
 * Returns billing status without blocking.
 * Use in API routes that need to know status but shouldn't block.
 */
export async function checkBillingStatus(
    databases: Databases,
    options: { userId?: string; organizationId?: string; workspaceId?: string }
): Promise<{
    status: BillingStatus;
    accountId?: string;
    daysUntilSuspension?: number;
    gracePeriodEnd?: string;
}> {
    try {
        if (options.workspaceId) {
            return getBillingStatusForWorkspace(databases, options.workspaceId);
        }

        if (options.organizationId) {
            const billingAccounts = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [
                    Query.equal("organizationId", options.organizationId),
                    Query.limit(1),
                ]
            );

            if (billingAccounts.total > 0) {
                const account = billingAccounts.documents[0];
                return {
                    status: account.billingStatus as BillingStatus,
                    accountId: account.$id,
                    gracePeriodEnd: account.gracePeriodEnd,
                };
            }
        }

        if (options.userId) {
            const billingAccounts = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [
                    Query.equal("userId", options.userId),
                    Query.limit(1),
                ]
            );

            if (billingAccounts.total > 0) {
                const account = billingAccounts.documents[0];
                return {
                    status: account.billingStatus as BillingStatus,
                    accountId: account.$id,
                    gracePeriodEnd: account.gracePeriodEnd,
                };
            }
        }

        return { status: BillingStatus.ACTIVE };
    } catch {
        return { status: BillingStatus.ACTIVE };
    }
}

/**
 * Check if request should be blocked based on billing status
 * 
 * Helper for routes that want to do their own blocking logic.
 */
export function shouldBlockRequest(status: BillingStatus, path: string): boolean {
    if (status !== BillingStatus.SUSPENDED) {
        return false;
    }

    return !isExemptPath(path);
}
