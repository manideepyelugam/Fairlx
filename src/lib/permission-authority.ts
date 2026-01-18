import "server-only";

import { Databases, Query } from "node-appwrite";
import {
    DATABASE_ID,
    ORGANIZATION_MEMBERS_ID,
    ORG_MEMBER_DEPARTMENTS_ID,
    DEPARTMENT_PERMISSIONS_ID,
} from "@/config";
import { OrganizationRole, OrgMemberStatus, OrganizationMember } from "@/features/organizations/types";
import { OrgMemberDepartment, DepartmentPermission } from "@/features/departments/types";
import { OrgPermissionKey } from "@/features/org-permissions/types";

// ============================================================================
// DEPARTMENT-DRIVEN PERMISSION AUTHORITY
// ============================================================================

/**
 * Permission Authority (Refactored for Department-Driven Model)
 * 
 * GOVERNANCE CONTRACT:
 * DEPARTMENT → PERMISSIONS → ROUTES → NAVIGATION
 * 
 * RULES:
 * 1. OWNER always has all permissions (bypass)
 * 2. Permissions come ONLY from departments
 * 3. No department = ZERO org permissions
 * 4. No role-based permission defaults (except OWNER)
 * 
 * @deprecated Use resolveUserOrgAccess for comprehensive access resolution.
 *             This module provides backwards-compatible permission checks.
 */

// ============================================================================
// LEGACY ROLE DEFAULTS (DEPRECATED)
// ============================================================================

/**
 * @deprecated Role defaults are deprecated except for OWNER.
 * Use department-based permissions via resolveUserOrgAccess.
 * 
 * ADMIN/MODERATOR/MEMBER roles must use departments for permissions.
 */
const ROLE_DEFAULT_PERMISSIONS: Record<OrganizationRole, OrgPermissionKey[]> = {
    [OrganizationRole.OWNER]: Object.values(OrgPermissionKey) as OrgPermissionKey[],
    [OrganizationRole.ADMIN]: [], // DEPRECATED: Must use departments
    [OrganizationRole.MODERATOR]: [], // DEPRECATED: Must use departments
    [OrganizationRole.MEMBER]: [],
};

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if user has an org-level permission (via departments)
 * 
 * RULES:
 * 1. OWNER always has all permissions (no DB check)
 * 2. Check department-based permissions
 * 3. Role defaults are DEPRECATED (except OWNER)
 */
export async function hasOrgPermission(
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

    // 3. Get user's departments
    const departmentAssignments = await databases.listDocuments<OrgMemberDepartment>(
        DATABASE_ID,
        ORG_MEMBER_DEPARTMENTS_ID,
        [Query.equal("orgMemberId", member.$id)]
    );

    const departmentIds = departmentAssignments.documents.map((d) => d.departmentId);

    // No departments = no permissions (critical rule)
    if (departmentIds.length === 0) {
        return false;
    }

    // 4. Check if any department has the required permission
    // CRITICAL: Use admin client for department_permissions collection
    // This collection has restricted access - session client reads fail silently
    try {
        const { createAdminClient } = await import("@/lib/appwrite");
        const { databases: adminDatabases } = await createAdminClient();

        const deptPermissions = await adminDatabases.listDocuments<DepartmentPermission>(
            DATABASE_ID,
            DEPARTMENT_PERMISSIONS_ID,
            [
                Query.equal("departmentId", departmentIds),
                Query.equal("permissionKey", permission),
            ]
        );

        return deptPermissions.total > 0;
    } catch (error) {
        console.error("[hasOrgPermission] Failed to check department permissions:", error);
        return false;
    }
}

/**
 * Get all permissions for a user in an org (via departments)
 */
export async function getOrgPermissions(
    databases: Databases,
    userId: string,
    organizationId: string
): Promise<{ permissions: OrgPermissionKey[]; role: OrganizationRole | null; departmentIds: string[] }> {
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
        return { permissions: [], role: null, departmentIds: [] };
    }

    const member = membership.documents[0];
    const role = member.role as OrganizationRole;

    // OWNER has all permissions
    if (role === OrganizationRole.OWNER) {
        return {
            permissions: Object.values(OrgPermissionKey) as OrgPermissionKey[],
            role,
            departmentIds: [],
        };
    }

    // Get user's departments
    const departmentAssignments = await databases.listDocuments<OrgMemberDepartment>(
        DATABASE_ID,
        ORG_MEMBER_DEPARTMENTS_ID,
        [Query.equal("orgMemberId", member.$id)]
    );

    const departmentIds = departmentAssignments.documents.map((d) => d.departmentId);

    // No departments = no permissions
    if (departmentIds.length === 0) {
        return { permissions: [], role, departmentIds: [] };
    }

    // Get all department permissions
    // CRITICAL: Use admin client for department_permissions collection
    let permissions: OrgPermissionKey[] = [];
    try {
        const { createAdminClient } = await import("@/lib/appwrite");
        const { databases: adminDatabases } = await createAdminClient();

        const deptPermissions = await adminDatabases.listDocuments<DepartmentPermission>(
            DATABASE_ID,
            DEPARTMENT_PERMISSIONS_ID,
            [
                Query.equal("departmentId", departmentIds),
                Query.limit(100),
            ]
        );

        permissions = [...new Set(
            deptPermissions.documents.map((p) => p.permissionKey as OrgPermissionKey)
        )];
    } catch (error) {
        console.error("[getOrgPermissions] Failed to fetch department permissions:", error);
    }

    return { permissions, role, departmentIds };
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
 * This is only kept for backwards compatibility.
 */
export function getRoleDefaultPermissions(role: OrganizationRole): OrgPermissionKey[] {
    console.warn(
        "[DEPRECATED] getRoleDefaultPermissions is deprecated. Use department-based permissions."
    );
    return ROLE_DEFAULT_PERMISSIONS[role] || [];
}
