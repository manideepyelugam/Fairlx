import "server-only";

import { Query, Databases } from "node-appwrite";
import { DATABASE_ID, ORGANIZATION_MEMBERS_ID, WORKSPACES_ID, MEMBERS_ID } from "@/config";
import { MemberRole } from "@/features/members/types";

/**
 * Authorization Guards
 * 
 * CRITICAL: Never trust incoming IDs.
 * Always derive orgId server-side from workspace/project ownership.
 * 
 * INVARIANTS:
 * - workspaceId/projectId access is verified against actual DB records
 * - orgId is ALWAYS derived server-side, never from client input
 * - Cross-org access is explicitly blocked
 * 
 * USAGE:
 * These guards MUST be called from:
 * - API routes (in addition to middleware)
 * - Server actions
 * - Background jobs
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export type AuthorizationErrorCode =
    | "NOT_ORG_MEMBER"
    | "NO_WORKSPACE_ACCESS"
    | "CROSS_ORG_ACCESS_DENIED"
    | "INSUFFICIENT_ROLE"
    | "NOT_WORKSPACE_MEMBER";

export class AuthorizationError extends Error {
    code: AuthorizationErrorCode;
    userId?: string;
    resourceId?: string;

    constructor(
        code: AuthorizationErrorCode,
        message: string,
        options?: { userId?: string; resourceId?: string }
    ) {
        super(message);
        this.name = "AuthorizationError";
        this.code = code;
        this.userId = options?.userId;
        this.resourceId = options?.resourceId;
    }
}

// ============================================================================
// ORGANIZATION MEMBERSHIP
// ============================================================================

/**
 * Assert user is a member of an organization
 * 
 * @throws AuthorizationError if not a member
 * @returns Organization membership details including role
 */
export async function assertOrgMembership(
    databases: Databases,
    userId: string,
    organizationId: string
): Promise<{ role: string; membershipId: string }> {
    try {
        const members = await databases.listDocuments(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", organizationId),
                Query.equal("userId", userId),
                Query.limit(1),
            ]
        );

        if (members.total === 0) {
            throw new AuthorizationError(
                "NOT_ORG_MEMBER",
                "You are not a member of this organization",
                { userId, resourceId: organizationId }
            );
        }

        const membership = members.documents[0];
        return {
            role: membership.role,
            membershipId: membership.$id,
        };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            throw error;
        }
        console.error("[AuthorizationGuards] assertOrgMembership failed:", error);
        throw new AuthorizationError(
            "NOT_ORG_MEMBER",
            "Unable to verify organization membership",
            { userId, resourceId: organizationId }
        );
    }
}

/**
 * Assert user has a specific role (or higher) in an organization
 * 
 * Role hierarchy: OWNER > ADMIN > MEMBER
 * 
 * @throws AuthorizationError if insufficient role
 */
export async function assertOrgRole(
    databases: Databases,
    userId: string,
    organizationId: string,
    requiredRole: "OWNER" | "ADMIN" | "MEMBER"
): Promise<{ role: string; membershipId: string }> {
    const membership = await assertOrgMembership(databases, userId, organizationId);

    const roleHierarchy: Record<string, number> = {
        "OWNER": 3,
        "ADMIN": 2,
        "MEMBER": 1,
    };

    const userLevel = roleHierarchy[membership.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        throw new AuthorizationError(
            "INSUFFICIENT_ROLE",
            `This action requires ${requiredRole} role or higher`,
            { userId, resourceId: organizationId }
        );
    }

    return membership;
}

// ============================================================================
// WORKSPACE ACCESS
// ============================================================================

export interface WorkspaceAccessResult {
    hasAccess: boolean;
    workspaceRole?: string;
    orgRole?: string;
    derivedOrgId?: string;
    derivedUserId?: string;
    workspaceMembershipId?: string;
}

/**
 * Derive organization ID from workspace (server-side)
 * 
 * CRITICAL: Use this instead of trusting incoming orgIds.
 * 
 * @returns Organization ID if workspace belongs to org, null for personal workspace
 */
export async function deriveOrgFromWorkspace(
    databases: Databases,
    workspaceId: string
): Promise<{ orgId: string | null; userId: string | null }> {
    try {
        const workspace = await databases.getDocument(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId
        );

        return {
            orgId: workspace.organizationId || null,
            userId: workspace.userId || null,
        };
    } catch (error) {
        console.error("[AuthorizationGuards] deriveOrgFromWorkspace failed:", error);
        return { orgId: null, userId: null };
    }
}

/**
 * Assert user has access to a workspace
 * 
 * CRITICAL: Derives orgId server-side, never trusts incoming orgId.
 * 
 * Access is granted if:
 * 1. User is a direct member of the workspace, OR
 * 2. User is an OWNER/ADMIN of the org that owns the workspace
 * 
 * @throws AuthorizationError if no access
 * @returns Access details including derived orgId
 */
export async function assertWorkspaceAccess(
    databases: Databases,
    userId: string,
    workspaceId: string
): Promise<WorkspaceAccessResult> {
    try {
        // 1. Get workspace to derive ownership (server-side derivation)
        const workspace = await databases.getDocument(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId
        );

        const result: WorkspaceAccessResult = {
            hasAccess: false,
            derivedOrgId: workspace.organizationId || undefined,
            derivedUserId: workspace.userId || undefined,
        };

        // 2. Check direct workspace membership
        const workspaceMembers = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.equal("userId", userId),
                Query.limit(1),
            ]
        );

        if (workspaceMembers.total > 0) {
            result.hasAccess = true;
            result.workspaceRole = workspaceMembers.documents[0].role;
            result.workspaceMembershipId = workspaceMembers.documents[0].$id;
        }

        // 3. For org workspaces, check org membership (OWNER/ADMIN can access all)
        if (workspace.organizationId) {
            const orgMembers = await databases.listDocuments(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [
                    Query.equal("organizationId", workspace.organizationId),
                    Query.equal("userId", userId),
                    Query.limit(1),
                ]
            );

            if (orgMembers.total > 0) {
                const orgRole = orgMembers.documents[0].role;
                result.orgRole = orgRole;

                // Org OWNER/ADMIN has implicit workspace access
                if (orgRole === "OWNER" || orgRole === "ADMIN") {
                    result.hasAccess = true;
                }
            }
        }

        // 4. For personal workspaces, check owner
        if (workspace.userId && workspace.userId === userId) {
            result.hasAccess = true;
            result.workspaceRole = MemberRole.OWNER;
        }

        // 5. Throw if no access
        if (!result.hasAccess) {
            throw new AuthorizationError(
                "NO_WORKSPACE_ACCESS",
                "You do not have access to this workspace",
                { userId, resourceId: workspaceId }
            );
        }

        return result;
    } catch (error) {
        if (error instanceof AuthorizationError) {
            throw error;
        }
        console.error("[AuthorizationGuards] assertWorkspaceAccess failed:", error);
        throw new AuthorizationError(
            "NO_WORKSPACE_ACCESS",
            "Unable to verify workspace access",
            { userId, resourceId: workspaceId }
        );
    }
}

/**
 * Assert user has a specific role in a workspace
 * 
 * @throws AuthorizationError if insufficient role
 */
export async function assertWorkspaceRole(
    databases: Databases,
    userId: string,
    workspaceId: string,
    requiredRole: "OWNER" | "ADMIN" | "MEMBER"
): Promise<WorkspaceAccessResult> {
    const access = await assertWorkspaceAccess(databases, userId, workspaceId);

    const roleHierarchy: Record<string, number> = {
        [MemberRole.OWNER]: 3,
        [MemberRole.ADMIN]: 2,
        [MemberRole.MEMBER]: 1,
    };

    // Get effective role (workspace role takes precedence, fall back to org role)
    const effectiveRole = access.workspaceRole || access.orgRole || "";
    const userLevel = roleHierarchy[effectiveRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        throw new AuthorizationError(
            "INSUFFICIENT_ROLE",
            `This action requires ${requiredRole} role or higher`,
            { userId, resourceId: workspaceId }
        );
    }

    return access;
}

// ============================================================================
// CROSS-ORG ACCESS BLOCKING
// ============================================================================

/**
 * Block cross-org access explicitly
 * 
 * Use when you have a resource's orgId and want to verify
 * the current user is a member of that org.
 * 
 * @throws AuthorizationError if user is not in the resource's org
 */
export async function blockCrossOrgAccess(
    databases: Databases,
    userId: string,
    resourceOrgId: string | null
): Promise<void> {
    // Personal resources (no org) - allow access if user is verified
    if (!resourceOrgId) {
        return;
    }

    // Check org membership
    const orgMembers = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        [
            Query.equal("organizationId", resourceOrgId),
            Query.equal("userId", userId),
            Query.limit(1),
        ]
    );

    if (orgMembers.total === 0) {
        throw new AuthorizationError(
            "CROSS_ORG_ACCESS_DENIED",
            "You cannot access resources from another organization",
            { userId, resourceId: resourceOrgId }
        );
    }
}

/**
 * Verify and derive org context for a workspace operation
 * 
 * This is the recommended entry point for workspace-scoped operations.
 * It validates access AND returns the server-derived org context.
 * 
 * @throws AuthorizationError if no access
 * @returns Server-derived context (never trust client input)
 */
export async function getSecureWorkspaceContext(
    databases: Databases,
    userId: string,
    workspaceId: string
): Promise<{
    workspaceId: string;
    organizationId: string | null;
    workspaceOwnerId: string | null;
    userRole: string;
    isOrgWorkspace: boolean;
}> {
    const access = await assertWorkspaceAccess(databases, userId, workspaceId);

    return {
        workspaceId,
        organizationId: access.derivedOrgId || null,
        workspaceOwnerId: access.derivedUserId || null,
        userRole: access.workspaceRole || access.orgRole || MemberRole.MEMBER,
        isOrgWorkspace: !!access.derivedOrgId,
    };
}
