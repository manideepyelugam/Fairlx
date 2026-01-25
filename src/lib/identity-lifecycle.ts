import "server-only";

import { Databases, Query, Models } from "node-appwrite";
import {
    DATABASE_ID,
    ORGANIZATIONS_ID,
    ORGANIZATION_MEMBERS_ID,
    MEMBERS_ID,
    BILLING_ACCOUNTS_ID,
} from "@/config";
import { OrganizationRole, OrgMemberStatus } from "@/features/organizations/types";
import { BillingStatus } from "@/features/billing/types";
import { assertInvariant } from "@/lib/invariants";

// ============================================================================
// LIFECYCLE STATE ENUM
// ============================================================================

/**
 * Single Identity Lifecycle Authority
 * 
 * ALL routing decisions MUST derive from this resolver.
 * This is the ONLY place that determines user lifecycle state.
 * 
 * INVARIANTS:
 * - State is computed server-side only
 * - No client-side state guessing
 * - Routing is derived, never hardcoded
 * - OWNER role has special handling
 */
export enum LifecycleState {
    // Unauthenticated states
    UNAUTHENTICATED = "UNAUTHENTICATED",
    EMAIL_UNVERIFIED = "EMAIL_UNVERIFIED",
    ACCOUNT_TYPE_PENDING = "ACCOUNT_TYPE_PENDING",

    // PERSONAL account states
    PERSONAL_ONBOARDING = "PERSONAL_ONBOARDING",
    PERSONAL_ACTIVE = "PERSONAL_ACTIVE",

    // ORG OWNER states
    ORG_OWNER_ONBOARDING = "ORG_OWNER_ONBOARDING",
    ORG_OWNER_NO_WORKSPACE = "ORG_OWNER_NO_WORKSPACE",
    ORG_OWNER_ACTIVE = "ORG_OWNER_ACTIVE",

    // ORG ADMIN/MODERATOR states
    ORG_ADMIN_NO_WORKSPACE = "ORG_ADMIN_NO_WORKSPACE",
    ORG_ADMIN_ACTIVE = "ORG_ADMIN_ACTIVE",

    // ORG MEMBER states
    ORG_MEMBER_PENDING = "ORG_MEMBER_PENDING",
    ORG_MEMBER_NO_WORKSPACE = "ORG_MEMBER_NO_WORKSPACE",
    ORG_MEMBER_ACTIVE = "ORG_MEMBER_ACTIVE",

    // Error/special states
    SUSPENDED = "SUSPENDED",
    DELETED = "DELETED",
    MUST_RESET_PASSWORD = "MUST_RESET_PASSWORD",
}

// ============================================================================
// RESULT TYPE
// ============================================================================

export interface ResolvedLifecycle {
    /** The computed lifecycle state */
    state: LifecycleState;

    /** User ID (null if unauthenticated) */
    userId: string | null;

    /** Account type from user prefs */
    accountType: "PERSONAL" | "ORG" | null;

    /** Active organization ID */
    orgId: string | null;

    /** Organization name for display */
    orgName: string | null;

    /** Organization image URL for display */
    orgImageUrl: string | null;

    /** User's role in the organization */
    orgRole: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER" | null;

    /** Org member status */
    orgMemberStatus: OrgMemberStatus | null;

    /** Active workspace ID */
    workspaceId: string | null;

    /** Whether user has any workspace */
    hasWorkspace: boolean;

    /** Whether user must reset password on first login */
    mustResetPassword: boolean;

    /** Whether email is verified */
    isEmailVerified: boolean;

    /** Billing status (ACTIVE, DUE, SUSPENDED) */
    billingStatus: BillingStatus | null;

    /** Computed redirect target (null if no redirect needed) */
    redirectTo: string | null;

    /** Paths allowed in current state */
    allowedPaths: string[];

    /** Paths blocked in current state */
    blockedPaths: string[];
}

// ============================================================================
// PATH CONSTANTS
// ============================================================================

const PUBLIC_ROUTES = [
    "/sign-in",
    "/sign-up",
    "/verify-email",
    "/verify-email-sent",
    "/verify-email-needed",
    "/forgot-password",
    "/reset-password",
    "/oauth",
    "/auth/callback",
];

const ONBOARDING_ROUTES = [
    "/onboarding",
];

const PROFILE_ROUTES = [
    "/profile",
    "/profile/accountinfo",
    "/profile/password",
];

const ORGANIZATION_ROUTES = [
    "/organization",
];

const BILLING_ROUTES = [
    "/organization/settings/billing",
    "/settings/billing",
    "/billing",
];

// ============================================================================
// ROUTING DERIVATION
// ============================================================================

/**
 * Derive allowed/blocked paths and redirect target from lifecycle state.
 * 
 * This is the ONLY place routing rules are defined.
 * All UI and middleware should consume this.
 */
export function getLifecycleRouting(state: LifecycleState): {
    redirectTo: string | null;
    allowedPaths: string[];
    blockedPaths: string[];
} {
    switch (state) {
        // ============================
        // UNAUTHENTICATED STATES
        // ============================
        case LifecycleState.UNAUTHENTICATED:
            return {
                redirectTo: "/sign-in",
                allowedPaths: [...PUBLIC_ROUTES],
                blockedPaths: ["*"], // All protected routes blocked
            };

        case LifecycleState.EMAIL_UNVERIFIED:
            return {
                redirectTo: "/verify-email-needed",
                allowedPaths: [...PUBLIC_ROUTES, "/verify-email-needed"],
                blockedPaths: ["/onboarding", "/workspaces", "/organization", "/welcome"],
            };

        case LifecycleState.ACCOUNT_TYPE_PENDING:
            return {
                redirectTo: "/onboarding",
                allowedPaths: [...ONBOARDING_ROUTES, ...PROFILE_ROUTES],
                blockedPaths: ["/workspaces", "/organization", "/welcome"],
            };

        // ============================
        // PERSONAL ACCOUNT STATES
        // ============================
        case LifecycleState.PERSONAL_ONBOARDING:
            return {
                redirectTo: "/onboarding",
                allowedPaths: [...ONBOARDING_ROUTES, ...PROFILE_ROUTES],
                blockedPaths: ["/organization"],
            };

        case LifecycleState.PERSONAL_ACTIVE:
            return {
                redirectTo: null,
                allowedPaths: ["*"], // Full access except org routes
                blockedPaths: ["/onboarding", "/organization"],
            };

        // ============================
        // ORG OWNER STATES
        // ============================
        case LifecycleState.ORG_OWNER_ONBOARDING:
            return {
                redirectTo: "/onboarding",
                allowedPaths: [...ONBOARDING_ROUTES, ...PROFILE_ROUTES],
                blockedPaths: ["/workspaces"],
            };

        case LifecycleState.ORG_OWNER_NO_WORKSPACE:
            return {
                redirectTo: null, // Allow /welcome
                allowedPaths: ["/welcome", ...ORGANIZATION_ROUTES, ...PROFILE_ROUTES, ...BILLING_ROUTES],
                blockedPaths: ["/onboarding", "/workspaces/*"],
            };

        case LifecycleState.ORG_OWNER_ACTIVE:
            return {
                redirectTo: null,
                allowedPaths: ["*"], // Full access
                blockedPaths: ["/onboarding", "/welcome"],
            };

        // ============================
        // ORG ADMIN/MODERATOR STATES
        // ============================
        case LifecycleState.ORG_ADMIN_NO_WORKSPACE:
            return {
                redirectTo: "/welcome",
                allowedPaths: ["/welcome", ...ORGANIZATION_ROUTES, ...PROFILE_ROUTES],
                blockedPaths: ["/onboarding", "/workspaces/*"],
            };

        case LifecycleState.ORG_ADMIN_ACTIVE:
            return {
                redirectTo: null,
                allowedPaths: ["*"], // Access based on permissions
                blockedPaths: ["/onboarding", "/welcome"],
            };

        // ============================
        // ORG MEMBER STATES
        // ============================
        case LifecycleState.ORG_MEMBER_PENDING:
            return {
                redirectTo: "/welcome",
                allowedPaths: ["/welcome", ...PROFILE_ROUTES, ...ORGANIZATION_ROUTES],
                blockedPaths: ["/onboarding", "/workspaces/*"],
                // NOTE: /organization access is controlled by department permissions
            };

        case LifecycleState.ORG_MEMBER_NO_WORKSPACE:
            return {
                redirectTo: "/welcome",
                allowedPaths: ["/welcome", ...PROFILE_ROUTES, ...ORGANIZATION_ROUTES],
                blockedPaths: ["/onboarding", "/workspaces/*"],
                // NOTE: /organization access is controlled by department permissions
            };

        case LifecycleState.ORG_MEMBER_ACTIVE:
            return {
                redirectTo: null,
                allowedPaths: ["/workspaces/*", ...PROFILE_ROUTES, ...ORGANIZATION_ROUTES],
                blockedPaths: ["/onboarding", "/welcome"],
                // NOTE: /organization access is controlled by department permissions,
                // not lifecycle state. Members with proper permissions can access org routes.
            };

        // ============================
        // SPECIAL STATES
        // ============================
        case LifecycleState.SUSPENDED:
            return {
                redirectTo: null, // Allow billing access
                allowedPaths: [...BILLING_ROUTES, ...PROFILE_ROUTES],
                blockedPaths: ["/workspaces/*", "/onboarding"],
            };

        case LifecycleState.DELETED:
            return {
                redirectTo: "/sign-in", // Force logout
                allowedPaths: [], // No paths allowed
                blockedPaths: ["*"],
            };

        case LifecycleState.MUST_RESET_PASSWORD:
            return {
                redirectTo: null, // Force overlay, not redirect
                allowedPaths: [], // No navigation allowed
                blockedPaths: ["*"],
            };

        default:
            console.error(`[IdentityLifecycle] Unknown state: ${state}`);
            return {
                redirectTo: "/sign-in",
                allowedPaths: [...PUBLIC_ROUTES],
                blockedPaths: ["*"],
            };
    }
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve user's complete lifecycle state.
 * 
 * This is the SINGLE AUTHORITY for identity lifecycle decisions.
 * All routing, guards, and UI state should derive from this.
 * 
 * @param databases - Appwrite databases instance
 * @param user - Current user (null if unauthenticated)
 * @returns Complete ResolvedLifecycle object
 */

async function resolveUserLifecycleStateInternal(
    databases: Databases,
    user: Models.User<Models.Preferences> | null
): Promise<ResolvedLifecycle> {
    // =========================================
    // STATE 1: UNAUTHENTICATED
    // =========================================
    if (!user) {
        const routing = getLifecycleRouting(LifecycleState.UNAUTHENTICATED);
        return {
            state: LifecycleState.UNAUTHENTICATED,
            userId: null,
            accountType: null,
            orgId: null,
            orgName: null,
            orgImageUrl: null,
            orgRole: null,
            orgMemberStatus: null,
            workspaceId: null,
            hasWorkspace: false,
            mustResetPassword: false,
            isEmailVerified: false,
            billingStatus: null,
            ...routing,
        };
    }

    const prefs = user.prefs || {};
    const accountType = prefs.accountType as "PERSONAL" | "ORG" | null;
    const mustResetPassword = prefs.mustResetPassword === true;
    const isEmailVerified = user.emailVerification;

    // =========================================
    // STATE 2: MUST RESET PASSWORD (highest priority)
    // =========================================
    if (mustResetPassword) {
        const routing = getLifecycleRouting(LifecycleState.MUST_RESET_PASSWORD);
        return {
            state: LifecycleState.MUST_RESET_PASSWORD,
            userId: user.$id,
            accountType,
            orgId: null,
            orgName: null,
            orgImageUrl: null,
            orgRole: null,
            orgMemberStatus: null,
            workspaceId: null,
            hasWorkspace: false,
            mustResetPassword: true,
            isEmailVerified,
            billingStatus: null,
            ...routing,
        };
    }

    // =========================================
    // STATE 3: EMAIL UNVERIFIED
    // =========================================
    if (!isEmailVerified) {
        const routing = getLifecycleRouting(LifecycleState.EMAIL_UNVERIFIED);
        return {
            state: LifecycleState.EMAIL_UNVERIFIED,
            userId: user.$id,
            accountType,
            orgId: null,
            orgName: null,
            orgImageUrl: null,
            orgRole: null,
            orgMemberStatus: null,
            workspaceId: null,
            hasWorkspace: false,
            mustResetPassword: false,
            isEmailVerified: false,
            billingStatus: null,
            ...routing,
        };
    }

    // =========================================
    // STATE 4: ACCOUNT TYPE PENDING
    // =========================================
    if (!accountType) {
        const routing = getLifecycleRouting(LifecycleState.ACCOUNT_TYPE_PENDING);
        return {
            state: LifecycleState.ACCOUNT_TYPE_PENDING,
            userId: user.$id,
            accountType: null,
            orgId: null,
            orgName: null,
            orgImageUrl: null,
            orgRole: null,
            orgMemberStatus: null,
            workspaceId: null,
            hasWorkspace: false,
            mustResetPassword: false,
            isEmailVerified: true,
            billingStatus: null,
            ...routing,
        };
    }

    // ===========================================
    // RESOLVE ORGANIZATION MEMBERSHIP
    // ===========================================
    let orgId: string | null = prefs.primaryOrganizationId || null;
    let orgName: string | null = null;
    let orgImageUrl: string | null = null;
    let orgRole: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER" | null = null;
    let orgMemberStatus: OrgMemberStatus | null = null;
    let hasOrg = false;

    if (accountType === "ORG") {
        // Try to find org membership
        if (orgId) {
            try {
                const memberships = await databases.listDocuments(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    [
                        Query.equal("organizationId", orgId),
                        Query.equal("userId", user.$id),
                    ]
                );

                if (memberships.total > 0) {
                    hasOrg = true;
                    orgRole = memberships.documents[0].role as typeof orgRole;
                    orgMemberStatus = memberships.documents[0].status as OrgMemberStatus;
                } else {
                    orgId = null;
                }
            } catch {
                orgId = null;
            }
        }

        // If no org from prefs, try to find ANY org
        if (!hasOrg) {
            try {
                const anyMembership = await databases.listDocuments(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    [Query.equal("userId", user.$id), Query.limit(1)]
                );

                if (anyMembership.total > 0) {
                    hasOrg = true;
                    orgId = anyMembership.documents[0].organizationId;
                    orgRole = anyMembership.documents[0].role as typeof orgRole;
                    orgMemberStatus = anyMembership.documents[0].status as OrgMemberStatus;
                }
            } catch {
                // No membership found
            }
        }

        // Fetch org details for display
        if (orgId) {
            try {
                const orgDoc = await databases.getDocument(
                    DATABASE_ID,
                    ORGANIZATIONS_ID,
                    orgId
                );
                orgName = orgDoc.name || null;
                orgImageUrl = orgDoc.imageUrl || null;
            } catch {
                // Org fetch may fail due to permissions - acceptable
            }
        }
    }

    // ===========================================
    // RESOLVE WORKSPACE MEMBERSHIP
    // ===========================================
    let hasWorkspace = false;
    let workspaceId: string | null = null;

    try {
        const workspaceMemberships = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [Query.equal("userId", user.$id), Query.limit(1)]
        );

        if (workspaceMemberships.total > 0) {
            hasWorkspace = true;
            workspaceId = workspaceMemberships.documents[0].workspaceId;
        }
    } catch {
        // No workspace membership
    }

    // ===========================================
    // CHECK BILLING STATUS
    // ===========================================
    let billingStatus: BillingStatus | null = null;

    if (accountType === "ORG" && orgId) {
        try {
            const billingAccounts = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [Query.equal("organizationId", orgId), Query.limit(1)]
            );

            if (billingAccounts.total > 0) {
                billingStatus = billingAccounts.documents[0].status as BillingStatus;
            }
        } catch {
            // Billing check may fail
        }
    } else if (accountType === "PERSONAL") {
        try {
            const billingAccounts = await databases.listDocuments(
                DATABASE_ID,
                BILLING_ACCOUNTS_ID,
                [Query.equal("userId", user.$id), Query.limit(1)]
            );

            if (billingAccounts.total > 0) {
                billingStatus = billingAccounts.documents[0].status as BillingStatus;
            }
        } catch {
            // Billing check may fail
        }
    }

    // ===========================================
    // CHECK SUSPENSION
    // ===========================================
    if (billingStatus === BillingStatus.SUSPENDED) {
        const routing = getLifecycleRouting(LifecycleState.SUSPENDED);
        return {
            state: LifecycleState.SUSPENDED,
            userId: user.$id,
            accountType,
            orgId,
            orgName,
            orgImageUrl,
            orgRole,
            orgMemberStatus,
            workspaceId,
            hasWorkspace,
            mustResetPassword: false,
            isEmailVerified: true,
            billingStatus,
            ...routing,
        };
    }

    // ===========================================
    // DERIVE FINAL STATE
    // ===========================================

    // PERSONAL account logic
    if (accountType === "PERSONAL") {
        if (!hasWorkspace) {
            const routing = getLifecycleRouting(LifecycleState.PERSONAL_ONBOARDING);
            return {
                state: LifecycleState.PERSONAL_ONBOARDING,
                userId: user.$id,
                accountType,
                orgId: null,
                orgName: null,
                orgImageUrl: null,
                orgRole: null,
                orgMemberStatus: null,
                workspaceId: null,
                hasWorkspace: false,
                mustResetPassword: false,
                isEmailVerified: true,
                billingStatus,
                ...routing,
            };
        }

        const routing = getLifecycleRouting(LifecycleState.PERSONAL_ACTIVE);
        return {
            state: LifecycleState.PERSONAL_ACTIVE,
            userId: user.$id,
            accountType,
            orgId: null,
            orgName: null,
            orgImageUrl: null,
            orgRole: null,
            orgMemberStatus: null,
            workspaceId,
            hasWorkspace: true,
            mustResetPassword: false,
            isEmailVerified: true,
            billingStatus,
            ...routing,
        };
    }

    // ORG account logic
    if (accountType === "ORG") {
        // No org found - needs onboarding (only for OWNER creating org)
        if (!hasOrg) {
            const routing = getLifecycleRouting(LifecycleState.ORG_OWNER_ONBOARDING);
            return {
                state: LifecycleState.ORG_OWNER_ONBOARDING,
                userId: user.$id,
                accountType,
                orgId: null,
                orgName: null,
                orgImageUrl: null,
                orgRole: null,
                orgMemberStatus: null,
                workspaceId: null,
                hasWorkspace: false,
                mustResetPassword: false,
                isEmailVerified: true,
                billingStatus: null,
                ...routing,
            };
        }

        // Check member status - INVITED means pending
        if (orgMemberStatus === OrgMemberStatus.INVITED) {
            const routing = getLifecycleRouting(LifecycleState.ORG_MEMBER_PENDING);
            return {
                state: LifecycleState.ORG_MEMBER_PENDING,
                userId: user.$id,
                accountType,
                orgId,
                orgName,
                orgImageUrl,
                orgRole,
                orgMemberStatus,
                workspaceId: null,
                hasWorkspace: false,
                mustResetPassword: false,
                isEmailVerified: true,
                billingStatus,
                ...routing,
            };
        }

        // OWNER states
        if (orgRole === OrganizationRole.OWNER) {
            if (!hasWorkspace) {
                const routing = getLifecycleRouting(LifecycleState.ORG_OWNER_NO_WORKSPACE);
                return {
                    state: LifecycleState.ORG_OWNER_NO_WORKSPACE,
                    userId: user.$id,
                    accountType,
                    orgId,
                    orgName,
                    orgImageUrl,
                    orgRole,
                    orgMemberStatus,
                    workspaceId: null,
                    hasWorkspace: false,
                    mustResetPassword: false,
                    isEmailVerified: true,
                    billingStatus,
                    ...routing,
                };
            }

            const routing = getLifecycleRouting(LifecycleState.ORG_OWNER_ACTIVE);
            return {
                state: LifecycleState.ORG_OWNER_ACTIVE,
                userId: user.$id,
                accountType,
                orgId,
                orgName,
                orgImageUrl,
                orgRole,
                orgMemberStatus,
                workspaceId,
                hasWorkspace: true,
                mustResetPassword: false,
                isEmailVerified: true,
                billingStatus,
                ...routing,
            };
        }

        // ADMIN/MODERATOR states
        if (orgRole === OrganizationRole.ADMIN || orgRole === OrganizationRole.MODERATOR) {
            if (!hasWorkspace) {
                const routing = getLifecycleRouting(LifecycleState.ORG_ADMIN_NO_WORKSPACE);
                return {
                    state: LifecycleState.ORG_ADMIN_NO_WORKSPACE,
                    userId: user.$id,
                    accountType,
                    orgId,
                    orgName,
                    orgImageUrl,
                    orgRole,
                    orgMemberStatus,
                    workspaceId: null,
                    hasWorkspace: false,
                    mustResetPassword: false,
                    isEmailVerified: true,
                    billingStatus,
                    ...routing,
                };
            }

            const routing = getLifecycleRouting(LifecycleState.ORG_ADMIN_ACTIVE);
            return {
                state: LifecycleState.ORG_ADMIN_ACTIVE,
                userId: user.$id,
                accountType,
                orgId,
                orgName,
                orgImageUrl,
                orgRole,
                orgMemberStatus,
                workspaceId,
                hasWorkspace: true,
                mustResetPassword: false,
                isEmailVerified: true,
                billingStatus,
                ...routing,
            };
        }

        // MEMBER states
        if (!hasWorkspace) {
            const routing = getLifecycleRouting(LifecycleState.ORG_MEMBER_NO_WORKSPACE);
            return {
                state: LifecycleState.ORG_MEMBER_NO_WORKSPACE,
                userId: user.$id,
                accountType,
                orgId,
                orgName,
                orgImageUrl,
                orgRole,
                orgMemberStatus,
                workspaceId: null,
                hasWorkspace: false,
                mustResetPassword: false,
                isEmailVerified: true,
                billingStatus,
                ...routing,
            };
        }

        const routing = getLifecycleRouting(LifecycleState.ORG_MEMBER_ACTIVE);
        return {
            state: LifecycleState.ORG_MEMBER_ACTIVE,
            userId: user.$id,
            accountType,
            orgId,
            orgName,
            orgImageUrl,
            orgRole,
            orgMemberStatus,
            workspaceId,
            hasWorkspace: true,
            mustResetPassword: false,
            isEmailVerified: true,
            billingStatus,
            ...routing,
        };
    }

    // Fallback - should never reach here
    console.error(`[IdentityLifecycle] Unexpected account type: ${accountType}`);
    const routing = getLifecycleRouting(LifecycleState.UNAUTHENTICATED);
    return {
        state: LifecycleState.UNAUTHENTICATED,
        userId: user.$id,
        accountType,
        orgId: null,
        orgName: null,
        orgImageUrl: null,
        orgRole: null,
        orgMemberStatus: null,
        workspaceId: null,
        hasWorkspace: false,
        mustResetPassword: false,
        isEmailVerified: true,
        billingStatus: null,
        ...routing,
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a path is allowed for a given lifecycle state
 */
export function isPathAllowedForState(
    lifecycle: ResolvedLifecycle,
    path: string
): boolean {
    // Check if path matches any allowed pattern
    for (const allowed of lifecycle.allowedPaths) {
        if (allowed === "*") return true;
        if (allowed.endsWith("/*")) {
            const prefix = allowed.slice(0, -2);
            if (path.startsWith(prefix)) return true;
        }
        if (path === allowed || path.startsWith(allowed + "/")) return true;
    }

    // Check if path matches any blocked pattern
    for (const blocked of lifecycle.blockedPaths) {
        if (blocked === "*") return false;
        if (blocked.endsWith("/*")) {
            const prefix = blocked.slice(0, -2);
            if (path.startsWith(prefix)) return false;
        }
        if (path === blocked || path.startsWith(blocked + "/")) return false;
    }

    // Default: allow if not explicitly blocked
    return true;
}

/**
 * Get the lifecycle state label for display
 */
export function getLifecycleStateLabel(state: LifecycleState): string {
    const labels: Record<LifecycleState, string> = {
        [LifecycleState.UNAUTHENTICATED]: "Not signed in",
        [LifecycleState.EMAIL_UNVERIFIED]: "Email verification required",
        [LifecycleState.ACCOUNT_TYPE_PENDING]: "Account setup required",
        [LifecycleState.PERSONAL_ONBOARDING]: "Create your workspace",
        [LifecycleState.PERSONAL_ACTIVE]: "Active",
        [LifecycleState.ORG_OWNER_ONBOARDING]: "Create your organization",
        [LifecycleState.ORG_OWNER_NO_WORKSPACE]: "Create your first workspace",
        [LifecycleState.ORG_OWNER_ACTIVE]: "Active",
        [LifecycleState.ORG_ADMIN_NO_WORKSPACE]: "Waiting for workspace assignment",
        [LifecycleState.ORG_ADMIN_ACTIVE]: "Active",
        [LifecycleState.ORG_MEMBER_PENDING]: "Invitation pending",
        [LifecycleState.ORG_MEMBER_NO_WORKSPACE]: "Waiting for workspace assignment",
        [LifecycleState.ORG_MEMBER_ACTIVE]: "Active",
        [LifecycleState.SUSPENDED]: "Account suspended",
        [LifecycleState.DELETED]: "Account deleted",
        [LifecycleState.MUST_RESET_PASSWORD]: "Password reset required",
    };

    return labels[state] || "Unknown";
}

/**
 * Check if state represents a fully active user
 */
export function isActiveState(state: LifecycleState): boolean {
    return [
        LifecycleState.PERSONAL_ACTIVE,
        LifecycleState.ORG_OWNER_ACTIVE,
        LifecycleState.ORG_ADMIN_ACTIVE,
        LifecycleState.ORG_MEMBER_ACTIVE,
    ].includes(state);
}

/**
 * Check if state requires onboarding
 */
export function requiresOnboarding(state: LifecycleState): boolean {
    return [
        LifecycleState.ACCOUNT_TYPE_PENDING,
        LifecycleState.PERSONAL_ONBOARDING,
        LifecycleState.ORG_OWNER_ONBOARDING,
    ].includes(state);
}

/**
 * Check if state is an org member waiting for access
 */
export function isRestrictedOrgMember(state: LifecycleState): boolean {
    return [
        LifecycleState.ORG_MEMBER_PENDING,
        LifecycleState.ORG_MEMBER_NO_WORKSPACE,
        LifecycleState.ORG_ADMIN_NO_WORKSPACE,
    ].includes(state);
}

// ============================================================================
// INVARIANT VALIDATION
// ============================================================================

function validateLifecycleInvariant(lifecycle: ResolvedLifecycle) {
    const { state, accountType, orgId, hasWorkspace, orgRole } = lifecycle;
    const hasOrg = !!orgId; // Derived from orgId

    // 1. Account Type Consistency
    if (state.startsWith("PERSONAL_")) {
        assertInvariant(
            accountType === "PERSONAL",
            "LIFECYCLE_PERSONAL_TYPE_MISMATCH",
            "PERSONAL state requires PERSONAL account type",
            { state, accountType }
        );
    }

    if (state.startsWith("ORG_")) {
        assertInvariant(
            accountType === "ORG",
            "LIFECYCLE_ORG_TYPE_MISMATCH",
            "ORG state requires ORG account type",
            { state, accountType }
        );
    }

    // 2. Organization Consistency
    if (state === LifecycleState.ORG_OWNER_ACTIVE ||
        state === LifecycleState.ORG_OWNER_NO_WORKSPACE ||
        state === LifecycleState.ORG_ADMIN_ACTIVE ||
        state === LifecycleState.ORG_MEMBER_ACTIVE) {

        assertInvariant(
            !!lifecycle.orgId,
            "LIFECYCLE_ORG_REQUIRED",
            "This state requires an active organization",
            { state, orgId: lifecycle.orgId }
        );
    }

    // 3. Workspace Consistency
    if (state.endsWith("_ACTIVE")) {
        assertInvariant(
            hasWorkspace,
            "LIFECYCLE_ACTIVE_WORKSPACE_REQUIRED",
            "ACTIVE state requires hasWorkspace=true",
            { state, hasWorkspace }
        );
    }

    if (state.includes("_NO_WORKSPACE")) {
        assertInvariant(
            !hasWorkspace,
            "LIFECYCLE_NO_WORKSPACE_MISMATCH",
            "NO_WORKSPACE state requires hasWorkspace=false",
            { state, hasWorkspace }
        );
    }

    // 4. Role Consistency
    if (state.startsWith("ORG_OWNER_")) {
        assertInvariant(
            orgRole === "OWNER",
            "LIFECYCLE_OWNER_ROLE_MISMATCH",
            "ORG_OWNER state requires OWNER role",
            { state, orgRole }
        );
    }
}

/**
 * Public Resolver Wrapper
 * Applies invariants to the internal resolution result.
 */
export async function resolveUserLifecycleState(
    databases: Databases,
    user: Models.User<Models.Preferences> | null
): Promise<ResolvedLifecycle> {
    const result = await resolveUserLifecycleStateInternal(databases, user);

    // Validate result consistency
    // In dev: throws. In prod: logs error.
    validateLifecycleInvariant(result);

    return result;
}
