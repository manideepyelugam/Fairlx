import "server-only";

import { OrgPermissionKey } from "@/features/org-permissions/types";
import { OrganizationRole } from "@/features/organizations/types";

// ============================================================================
// PERMISSION INVARIANTS
// ============================================================================

/**
 * Permission Invariants
 * 
 * RULES:
 * - Permissions are EXPLICIT (not inferred from department)
 * - OWNER has all permissions implicitly
 * - Role defaults are fallback, explicit grants override
 * - No permission inheritance across org/workspace boundary
 */

/**
 * Validate that a permission key is valid
 */
export function isValidPermissionKey(key: string): key is OrgPermissionKey {
    return Object.values(OrgPermissionKey).includes(key as OrgPermissionKey);
}

/**
 * Get permissions that a role grants by default
 */
export function getRoleDefaultPermissions(role: OrganizationRole): OrgPermissionKey[] {
    const ROLE_DEFAULTS: Record<OrganizationRole, OrgPermissionKey[]> = {
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

    return ROLE_DEFAULTS[role] || [];
}

/**
 * Check if permission can be granted/revoked
 * 
 * INVARIANT: Cannot modify OWNER permissions (they have all)
 */
export function canModifyPermissions(targetRole: OrganizationRole): boolean {
    return targetRole !== OrganizationRole.OWNER;
}

/**
 * Validate permission assignment is allowed
 */
export function validatePermissionGrant(
    grantorRole: OrganizationRole,
    permission: OrgPermissionKey
): { valid: boolean; reason?: string } {
    // Only OWNER can grant permissions
    if (grantorRole !== OrganizationRole.OWNER) {
        return { valid: false, reason: "Only OWNER can grant permissions" };
    }

    // Validate permission key
    if (!isValidPermissionKey(permission)) {
        return { valid: false, reason: "Invalid permission key" };
    }

    return { valid: true };
}

/**
 * INVARIANT: Org permissions never grant workspace access
 */
export function assertOrgWorkspaceSeparation(): void {
    // This is a compile-time/documentation invariant
    // Org permissions are prefixed with "org."
    // Workspace permissions would be prefixed with "ws."
    // They should never overlap
}
