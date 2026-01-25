import "server-only";

import { Databases } from "node-appwrite";
import { OrganizationRole } from "@/features/organizations/types";
import { OrgPermissionKey } from "@/features/org-permissions/types";
import {
    resolveUserOrgAccess,
    hasOrgPermissionFromAccess
} from "@/lib/permissions/resolveUserOrgAccess";

// ============================================================================
// DEPARTMENT-DRIVEN PERMISSION AUTHORITY (LEGACY COMPATIBILITY LAYER)
// ============================================================================

/**
 * @deprecated Use resolveUserOrgAccess directly for comprehensive access resolution.
 * This function handles the permission check using the new authoritative resolver.
 */
export async function hasOrgPermission(
    databases: Databases,
    userId: string,
    organizationId: string,
    permission: OrgPermissionKey
): Promise<boolean> {
    const access = await resolveUserOrgAccess(databases, userId, organizationId);
    return hasOrgPermissionFromAccess(access, permission);
}

/**
 * @deprecated Use resolveUserOrgAccess directly.
 */
export async function getOrgPermissions(
    databases: Databases,
    userId: string,
    organizationId: string
): Promise<{ permissions: OrgPermissionKey[]; role: OrganizationRole | null; departmentIds: string[] }> {
    const access = await resolveUserOrgAccess(databases, userId, organizationId);
    return {
        permissions: access.permissions,
        role: access.role,
        departmentIds: access.departmentIds
    };
}

/**
 * Check if role meets minimum level
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

/**
 * @deprecated Use resolveUserOrgAccess instead.
 */
export function getRoleDefaultPermissions(role: OrganizationRole): OrgPermissionKey[] {
    console.warn(
        "[DEPRECATED] getRoleDefaultPermissions is deprecated. Use department-based permissions."
    );
    // Return empty as role defaults are removed
    return [];
}
