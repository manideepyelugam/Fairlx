import "server-only";

import { Databases, Query } from "node-appwrite";
import { DATABASE_ID, ORG_MEMBER_PERMISSIONS_ID, ORGANIZATION_MEMBERS_ID } from "@/config";
import { OrganizationRole, OrgMemberStatus, OrganizationMember } from "@/features/organizations/types";
import { OrgMemberPermission, OrgPermissionKey } from "./types";

// ============================================================================
// SECURITY: OWNER-ONLY DEFAULT PERMISSIONS
// ============================================================================

/**
 * SECURITY: Only OWNER has implicit permissions.
 * ADMIN/MODERATOR/MEMBER must use DEPARTMENTS for permissions.
 * 
 * This constant is kept for OWNER bypass only.
 */

// ============================================================================
// PERMISSION CHECK HELPER
// ============================================================================

/**
 * Check if user has an org-level permission
 * 
 * RULES:
 * 1. OWNER always has all permissions (no DB check)
 * 2. Check explicit user-level permissions first
 * 3. Fall back to role defaults
 * 
 * @param databases - Appwrite databases instance
 * @param userId - User ID to check
 * @param organizationId - Organization ID
 * @param permission - Permission key to check
 * @returns true if user has permission
 */
export async function hasOrgPermissionExplicit(
    databases: Databases,
    userId: string,
    organizationId: string,
    permission: OrgPermissionKey
): Promise<boolean> {
    // 1. Get user's org membership
    const membership = await databases.listDocuments<OrganizationMember>(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        [
            Query.equal("organizationId", organizationId),
            Query.equal("userId", userId),
            Query.equal("status", OrgMemberStatus.ACTIVE),
        ]
    );

    if (membership.total === 0) {
        return false; // Not an org member
    }

    const member = membership.documents[0];
    const role = member.role as OrganizationRole;

    // 2. OWNER always has all permissions
    if (role === OrganizationRole.OWNER) {
        return true;
    }

    // 3. Check explicit user-level permission (from departments/direct grants)
    const explicitPerm = await databases.listDocuments<OrgMemberPermission>(
        DATABASE_ID,
        ORG_MEMBER_PERMISSIONS_ID,
        [
            Query.equal("orgMemberId", member.$id),
            Query.equal("permissionKey", permission),
        ]
    );

    // Non-owners only get explicit permissions - NO role-based fallback
    return explicitPerm.total > 0;
}

/**
 * Get all permissions for a user in an org
 * Returns combined explicit + role-based permissions
 */
export async function getOrgPermissions(
    databases: Databases,
    userId: string,
    organizationId: string
): Promise<{ permissions: OrgPermissionKey[]; role: OrganizationRole | null }> {
    // Get user's org membership
    const membership = await databases.listDocuments<OrganizationMember>(
        DATABASE_ID,
        ORGANIZATION_MEMBERS_ID,
        [
            Query.equal("organizationId", organizationId),
            Query.equal("userId", userId),
            Query.equal("status", OrgMemberStatus.ACTIVE),
        ]
    );

    if (membership.total === 0) {
        return { permissions: [], role: null };
    }

    const member = membership.documents[0];
    const role = member.role as OrganizationRole;

    // OWNER has all
    if (role === OrganizationRole.OWNER) {
        return {
            permissions: Object.values(OrgPermissionKey) as OrgPermissionKey[],
            role,
        };
    }

    // Get explicit permissions only (from departments/direct grants)
    const explicitPerms = await databases.listDocuments<OrgMemberPermission>(
        DATABASE_ID,
        ORG_MEMBER_PERMISSIONS_ID,
        [Query.equal("orgMemberId", member.$id)]
    );

    const explicitKeys = explicitPerms.documents.map(
        (p) => p.permissionKey as OrgPermissionKey
    );

    // Non-owners get ONLY explicit permissions - NO role-based fallback
    return { permissions: explicitKeys, role };
}

/**
 * Check if role has minimum level
 */
export function hasMinimumRole(
    currentRole: OrganizationRole,
    requiredRole: OrganizationRole
): boolean {
    const hierarchy: Record<OrganizationRole, number> = {
        [OrganizationRole.OWNER]: 4,
        [OrganizationRole.ADMIN]: 3,
        [OrganizationRole.MODERATOR]: 2,
        [OrganizationRole.MEMBER]: 1,
    };
    return hierarchy[currentRole] >= hierarchy[requiredRole];
}
