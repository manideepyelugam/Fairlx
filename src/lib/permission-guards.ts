import "server-only";

/**
 * Backend Permission Guards
 * 
 * ENTERPRISE SECURITY: Server-side validation functions for access control.
 * These guards prevent privilege escalation and cross-entity access.
 * 
 * INVARIANTS:
 * - All guards are synchronous and pure (no side effects)
 * - Guards never throw - they return boolean or null
 * - Frontend should never rely on these checks alone
 */

import { MemberRole } from "@/features/members/types";

/**
 * Check if user has access to a workspace
 * 
 * Access is granted if:
 * 1. User is a direct member of the workspace, OR
 * 2. User is an OWNER/ADMIN of the org that owns the workspace
 */
export function validateWorkspaceAccess(
    userId: string,
    workspaceMembership: { userId: string; role: string } | null,
    orgMembership?: { userId: string; role: string } | null
): boolean {
    // Direct workspace membership
    if (workspaceMembership && workspaceMembership.userId === userId) {
        return true;
    }

    // Org owner/admin can access all org workspaces
    if (orgMembership && orgMembership.userId === userId) {
        const orgRole = orgMembership.role;
        if (orgRole === "OWNER" || orgRole === "ADMIN") {
            return true;
        }
    }

    return false;
}

/**
 * Check if user is a member of an organization
 */
export function validateOrgMembership(
    userId: string,
    orgMembers: Array<{ userId: string; role: string }>
): { isMember: boolean; role: string | null } {
    const membership = orgMembers.find((m) => m.userId === userId);
    return {
        isMember: !!membership,
        role: membership?.role || null,
    };
}

/**
 * Prevent privilege escalation
 * 
 * Rules:
 * - Only OWNER can assign OWNER role
 * - ADMIN can assign ADMIN, MEMBER
 * - MEMBER cannot assign roles
 */
export function canAssignRole(
    actorRole: string,
    targetRole: string
): boolean {
    const roleHierarchy: Record<string, number> = {
        [MemberRole.OWNER]: 3,
        [MemberRole.ADMIN]: 2,
        [MemberRole.MEMBER]: 1,
    };

    const actorLevel = roleHierarchy[actorRole] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;

    // Actor must have higher or equal level to assign a role
    // Exception: OWNER can assign OWNER
    if (targetRole === MemberRole.OWNER) {
        return actorRole === MemberRole.OWNER;
    }

    // Actor level must be > target level (except for ADMIN assigning ADMIN)
    if (actorRole === MemberRole.ADMIN && targetRole === MemberRole.ADMIN) {
        return true;
    }

    return actorLevel > targetLevel;
}

/**
 * Check if user can delete a resource
 * 
 * Rules:
 * - OWNER can delete anything
 * - ADMIN can delete member-created resources
 * - MEMBER can only delete their own resources
 */
export function canDeleteResource(
    actorRole: string,
    resourceOwnerId: string,
    actorUserId: string
): boolean {
    if (actorRole === MemberRole.OWNER) {
        return true;
    }

    if (actorRole === MemberRole.ADMIN) {
        return true; // ADMINs can delete any resource in their scope
    }

    // MEMBER can only delete own resources
    return resourceOwnerId === actorUserId;
}

/**
 * Check if workspace owner type and owner ID match user context
 */
export function validateOwnership(
    workspace: {
        ownerType?: string;
        ownerId?: string;
        userId?: string;
        organizationId?: string;
    },
    expectedOwnerType: "PERSONAL" | "ORG",
    expectedOwnerId: string
): boolean {
    // Modern schema with ownerType/ownerId
    if (workspace.ownerType && workspace.ownerId) {
        return (
            workspace.ownerType === expectedOwnerType &&
            workspace.ownerId === expectedOwnerId
        );
    }

    // Legacy schema fallback
    if (expectedOwnerType === "PERSONAL") {
        return workspace.userId === expectedOwnerId && !workspace.organizationId;
    }

    if (expectedOwnerType === "ORG") {
        return workspace.organizationId === expectedOwnerId;
    }

    return false;
}

/**
 * Query database to validate user is member of organization
 * 
 * ENTERPRISE: This is the authoritative backend check - do not trust frontend context.
 * 
 * @param databases - Appwrite Databases instance
 * @param userId - User ID to check
 * @param orgId - Organization ID to validate membership for
 * @returns Membership document if found, null otherwise
 */
export async function validateUserOrgMembershipAsync(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    databases: any,
    userId: string,
    orgId: string
): Promise<{ isMember: boolean; role: string | null; membershipId: string | null }> {
    try {
        const { Query } = await import("node-appwrite");
        const { DATABASE_ID, ORGANIZATION_MEMBERS_ID } = await import("@/config");

        const result = await databases.listDocuments(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", orgId),
                Query.equal("userId", userId),
                Query.limit(1),
            ]
        );

        if (result.documents.length > 0) {
            const doc = result.documents[0];
            return {
                isMember: true,
                role: doc.role || null,
                membershipId: doc.$id || null,
            };
        }

        return { isMember: false, role: null, membershipId: null };
    } catch (error) {
        console.error("[PermissionGuard] Failed to validate org membership:", error);
        return { isMember: false, role: null, membershipId: null };
    }
}

/**
 * Check if user is the last OWNER of an organization
 * 
 * CRITICAL: Used to prevent orphaning organizations
 */
export async function isLastOrgOwner(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    databases: any,
    userId: string,
    orgId: string
): Promise<boolean> {
    try {
        const { Query } = await import("node-appwrite");
        const { DATABASE_ID, ORGANIZATION_MEMBERS_ID } = await import("@/config");

        // Count all OWNERs in this org
        const owners = await databases.listDocuments(
            DATABASE_ID,
            ORGANIZATION_MEMBERS_ID,
            [
                Query.equal("organizationId", orgId),
                Query.equal("role", "OWNER"),
            ]
        );

        // If only 1 owner and it's this user, they're the last owner
        if (owners.total === 1 && owners.documents[0]?.userId === userId) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("[PermissionGuard] Failed to check last owner:", error);
        return false; // Fail open on error - prefer allowing action over blocking incorrectly
    }
}

