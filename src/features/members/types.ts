import { Models } from "node-appwrite";

// ===============================
// Legacy Workspace Member Roles (DEPRECATED)
// ===============================

/**
 * @deprecated Use WorkspaceMemberRole instead.
 * Kept for backward compatibility during migration.
 * 
 * Workspace member roles (legacy)
 * 
 * WHY OWNER is separate from ADMIN:
 * - OWNER can delete workspace, transfer ownership, manage billing
 * - ADMIN can manage members and settings
 * - MEMBER can view and contribute
 * 
 * INVARIANT: Every workspace must have exactly ≥1 OWNER
 */
export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

/**
 * @deprecated Use WorkspaceMember instead.
 * Legacy workspace member type - references userId directly.
 */
export type Member = Models.Document & {
  workspaceId: string;
  userId: string;
  role: MemberRole | string;
  name?: string;
  email?: string;
  profileImageUrl?: string | null;
};

// ===============================
// NEW: Workspace Member Roles (Target Model)
// ===============================

/**
 * Workspace-level roles
 * 
 * RULE: Workspace access ALWAYS requires explicit membership.
 *       These roles define WHERE the user can act within a workspace.
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
export enum WorkspaceMemberRole {
  WS_ADMIN = "WS_ADMIN",
  WS_EDITOR = "WS_EDITOR",
  WS_VIEWER = "WS_VIEWER",
}

/**
 * NEW: Workspace member type (TARGET MODEL)
 * 
 * CRITICAL CHANGE: References orgMemberId, NOT userId!
 * This ensures:
 * - Workspace access requires org membership
 * - Single source of identity at org level
 * - No direct user-workspace relationship
 * 
 * INVARIANT: orgMemberId must reference a valid org_member
 *            from the SAME organization that owns this workspace
 */
export type WorkspaceMember = Models.Document & {
  workspaceId: string;
  /**
   * CRITICAL: References org_members.$id, NOT userId!
   * This is the authoritative identity link.
   */
  orgMemberId: string;
  role: WorkspaceMemberRole;
  createdAt: string;
  /**
   * Denormalized from org member for display efficiency
   * Updated when org membership is modified
   */
  name?: string;
  email?: string;
  profileImageUrl?: string | null;
};

// ===============================
// Role Mapping (for migration)
// ===============================

/**
 * Maps legacy MemberRole to new WorkspaceMemberRole
 * Used during migration to preserve access levels
 */
export const LEGACY_TO_WS_ROLE_MAP: Record<MemberRole, WorkspaceMemberRole> = {
  [MemberRole.OWNER]: WorkspaceMemberRole.WS_ADMIN,
  [MemberRole.ADMIN]: WorkspaceMemberRole.WS_ADMIN,
  [MemberRole.MEMBER]: WorkspaceMemberRole.WS_EDITOR,
};
