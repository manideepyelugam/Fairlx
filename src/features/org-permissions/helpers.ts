import "server-only";

import { Databases, Query } from "node-appwrite";
import { DATABASE_ID, ORG_MEMBER_PERMISSIONS_ID, ORGANIZATION_MEMBERS_ID } from "@/config";
import { OrganizationRole, OrgMemberStatus, OrganizationMember } from "@/features/organizations/types";
import { OrgMemberPermission, OrgPermissionKey } from "./types";

// ============================================================================
// ROLE → PERMISSION DEFAULTS
// ============================================================================

/**
 * Default permissions by role
 * 
 * OWNER: All permissions (checked first, before DB)
 * ADMIN: Management permissions
 * MODERATOR: Limited assignment permissions
 * MEMBER: No org permissions
 */
const ROLE_DEFAULT_PERMISSIONS: Record<OrganizationRole, OrgPermissionKey[]> = {
    [OrganizationRole.OWNER]: Object.values(OrgPermissionKey) as OrgPermissionKey[],
    [OrganizationRole.ADMIN]: [
        OrgPermissionKey.BILLING_VIEW,
        OrgPermissionKey.MEMBERS_VIEW,
        OrgPermissionKey.MEMBERS_MANAGE,
        OrgPermissionKey.SETTINGS_MANAGE,
        OrgPermissionKey.AUDIT_VIEW,
        OrgPermissionKey.DEPARTMENTS_MANAGE,
        OrgPermissionKey.SECURITY_VIEW,
        OrgPermissionKey.WORKSPACE_CREATE,
        OrgPermissionKey.WORKSPACE_ASSIGN,
    ],
    [OrganizationRole.MODERATOR]: [
        OrgPermissionKey.MEMBERS_VIEW,
        OrgPermissionKey.WORKSPACE_ASSIGN,
    ],
    [OrganizationRole.MEMBER]: [],
};

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

    // 3. Check explicit user-level permission
    const explicitPerm = await databases.listDocuments<OrgMemberPermission>(
        DATABASE_ID,
        ORG_MEMBER_PERMISSIONS_ID,
        [
            Query.equal("orgMemberId", member.$id),
            Query.equal("permissionKey", permission),
        ]
    );

    if (explicitPerm.total > 0) {
        return true;
    }

    // 4. Fall back to role defaults
    return ROLE_DEFAULT_PERMISSIONS[role]?.includes(permission) ?? false;
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

    // Get explicit permissions
    const explicitPerms = await databases.listDocuments<OrgMemberPermission>(
        DATABASE_ID,
        ORG_MEMBER_PERMISSIONS_ID,
        [Query.equal("orgMemberId", member.$id)]
    );

    const explicitKeys = explicitPerms.documents.map(
        (p) => p.permissionKey as OrgPermissionKey
    );

    // Combine with role defaults
    const roleDefaults = ROLE_DEFAULT_PERMISSIONS[role] || [];
    const combined = [...new Set([...explicitKeys, ...roleDefaults])];

    return { permissions: combined, role };
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
