/**
 * Permission Matrix
 * 
 * Centralized permission definitions for organization and workspace roles.
 * 
 * RULE: Org role defines WHAT you can manage globally.
 *       Workspace role defines WHERE you can act.
 * 
 * INVARIANTS:
 * - Org role NEVER implies workspace access
 * - Workspace access ALWAYS requires explicit membership
 */

import "server-only";

import { OrganizationRole, OrgMemberStatus } from "@/features/organizations/types";
import { WorkspaceMemberRole } from "@/features/members/types";

// ============================================================================
// ORG-LEVEL PERMISSIONS
// ============================================================================

/**
 * Permission types for organization-level actions
 */
export type OrgPermission =
    | "FULL_CONTROL"         // Reserved for OWNER
    | "BILLING"              // Manage billing settings
    | "DELETE_ORG"           // Delete organization
    | "INVITE_MEMBERS"       // Invite new org members
    | "REMOVE_MEMBERS"       // Remove org members
    | "CREATE_WORKSPACES"    // Create workspaces in org
    | "ASSIGN_TO_WORKSPACES" // Assign org members to workspaces
    | "MANAGE_DEPARTMENTS"   // Create, edit, delete departments
    | "VIEW_AUDIT_LOGS"      // View org audit logs
    | "VIEW_ORG";            // View org details

/**
 * Organization role permission mapping
 * 
 * OWNER: Full org control
 * - Billing management
 * - Org deletion
 * - All admin permissions
 * 
 * ADMIN: Member and workspace management
 * - Invite/remove org members
 * - Create workspaces
 * - Manage departments
 * 
 * MODERATOR: Workspace assignment only
 * - Assign org members to workspaces
 * 
 * MEMBER: View only
 * - No org-level management
 */
export const ORG_ROLE_PERMISSIONS: Record<OrganizationRole, readonly OrgPermission[]> = {
    [OrganizationRole.OWNER]: [
        "FULL_CONTROL",
        "BILLING",
        "DELETE_ORG",
        "INVITE_MEMBERS",
        "REMOVE_MEMBERS",
        "CREATE_WORKSPACES",
        "ASSIGN_TO_WORKSPACES",
        "MANAGE_DEPARTMENTS",
        "VIEW_AUDIT_LOGS",
        "VIEW_ORG",
    ] as const,
    [OrganizationRole.ADMIN]: [
        "INVITE_MEMBERS",
        "REMOVE_MEMBERS",
        "CREATE_WORKSPACES",
        "ASSIGN_TO_WORKSPACES",
        "MANAGE_DEPARTMENTS",
        "VIEW_AUDIT_LOGS",
        "VIEW_ORG",
    ] as const,
    [OrganizationRole.MODERATOR]: [
        "ASSIGN_TO_WORKSPACES",
        "VIEW_ORG",
    ] as const,
    [OrganizationRole.MEMBER]: [
        "VIEW_ORG",
    ] as const,
};

/**
 * Role hierarchy for comparison
 * Higher number = more permissions
 */
export const ORG_ROLE_HIERARCHY: Record<OrganizationRole, number> = {
    [OrganizationRole.OWNER]: 4,
    [OrganizationRole.ADMIN]: 3,
    [OrganizationRole.MODERATOR]: 2,
    [OrganizationRole.MEMBER]: 1,
};

// ============================================================================
// WORKSPACE-LEVEL PERMISSIONS
// ============================================================================

/**
 * Permission types for workspace-level actions
 */
export type WsPermission =
    | "MANAGE_MEMBERS"    // Add/remove workspace members
    | "MANAGE_SETTINGS"   // Modify workspace settings
    | "CREATE_PROJECTS"   // Create new projects
    | "CREATE_SPACES"     // Create new spaces
    | "EDIT_PROJECTS"     // Edit existing projects
    | "EDIT_SPACES"       // Edit existing spaces
    | "VIEW_ALL";         // View all workspace data

/**
 * Workspace role permission mapping
 * 
 * WS_ADMIN: Full workspace control
 * - Manage workspace members and settings
 * - All editor permissions
 * 
 * WS_EDITOR: Content creation and editing
 * - Create/edit projects, tasks, spaces
 * - Read access to all workspace data
 * 
 * WS_VIEWER: Read-only access
 * - View projects, tasks, spaces
 * - Cannot modify any data
 */
export const WS_ROLE_PERMISSIONS: Record<WorkspaceMemberRole, readonly WsPermission[]> = {
    [WorkspaceMemberRole.WS_ADMIN]: [
        "MANAGE_MEMBERS",
        "MANAGE_SETTINGS",
        "CREATE_PROJECTS",
        "CREATE_SPACES",
        "EDIT_PROJECTS",
        "EDIT_SPACES",
        "VIEW_ALL",
    ] as const,
    [WorkspaceMemberRole.WS_EDITOR]: [
        "CREATE_PROJECTS",
        "CREATE_SPACES",
        "EDIT_PROJECTS",
        "EDIT_SPACES",
        "VIEW_ALL",
    ] as const,
    [WorkspaceMemberRole.WS_VIEWER]: [
        "VIEW_ALL",
    ] as const,
};

/**
 * Workspace role hierarchy for comparison
 * Higher number = more permissions
 */
export const WS_ROLE_HIERARCHY: Record<WorkspaceMemberRole, number> = {
    [WorkspaceMemberRole.WS_ADMIN]: 3,
    [WorkspaceMemberRole.WS_EDITOR]: 2,
    [WorkspaceMemberRole.WS_VIEWER]: 1,
};

// ============================================================================
// PERMISSION CHECK HELPERS
// ============================================================================

/**
 * Check if org role has a specific permission
 */
export function hasOrgPermission(
    role: OrganizationRole,
    permission: OrgPermission
): boolean {
    return ORG_ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if org role meets minimum required role level
 */
export function hasMinimumOrgRole(
    role: OrganizationRole,
    requiredRole: OrganizationRole
): boolean {
    return ORG_ROLE_HIERARCHY[role] >= ORG_ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if workspace role has a specific permission
 */
export function hasWsPermission(
    role: WorkspaceMemberRole,
    permission: WsPermission
): boolean {
    return WS_ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if workspace role meets minimum required role level
 */
export function hasMinimumWsRole(
    role: WorkspaceMemberRole,
    requiredRole: WorkspaceMemberRole
): boolean {
    return WS_ROLE_HIERARCHY[role] >= WS_ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if org member status allows access
 * Only ACTIVE members should have access
 */
export function isActiveOrgMember(status: OrgMemberStatus): boolean {
    return status === OrgMemberStatus.ACTIVE;
}

// ============================================================================
// PERMISSION DESCRIPTIONS (for UI)
// ============================================================================

export const ORG_ROLE_DESCRIPTIONS: Record<OrganizationRole, string> = {
    [OrganizationRole.OWNER]: "Full control including billing and deletion",
    [OrganizationRole.ADMIN]: "Manage members and create workspaces",
    [OrganizationRole.MODERATOR]: "Assign members to workspaces",
    [OrganizationRole.MEMBER]: "View organization details only",
};

export const WS_ROLE_DESCRIPTIONS: Record<WorkspaceMemberRole, string> = {
    [WorkspaceMemberRole.WS_ADMIN]: "Full workspace control",
    [WorkspaceMemberRole.WS_EDITOR]: "Create and edit content",
    [WorkspaceMemberRole.WS_VIEWER]: "Read-only access",
};
