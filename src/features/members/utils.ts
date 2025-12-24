import { Query, type Databases } from "node-appwrite";

import { DATABASE_ID, MEMBERS_ID, WORKSPACES_ID, ORGANIZATION_MEMBERS_ID } from "@/config";

interface GetMemberProps {
  databases: Databases;
  workspaceId: string;
  userId: string;
}

/**
 * Get workspace member with organization membership fallback
 * 
 * WHY: For ORG account workspaces, users may have permissions via
 * organization membership even if not explicitly added to workspace.
 * 
 * BEHAVIOR:
 * - First checks direct workspace membership
 * - If workspace has organizationId, also checks org membership
 * - Returns member document if found in either
 */
export const getMember = async ({
  databases,
  workspaceId,
  userId,
}: GetMemberProps) => {
  // Check direct workspace membership
  const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
    Query.equal("workspaceId", workspaceId),
    Query.equal("userId", userId),
  ]);

  if (members.documents[0]) {
    return members.documents[0];
  }

  // Check if user has org-level access to this workspace
  const orgMember = await getOrganizationMemberForWorkspace({
    databases,
    workspaceId,
    userId,
  });

  // If user is org member, they have implicit workspace access
  if (orgMember) {
    // Return a synthetic member with org-derived role
    return {
      ...orgMember,
      workspaceId,
      role: orgMember.role, // Org role propagates to workspace
      isOrgMember: true, // Flag to indicate org-level membership
    };
  }

  return undefined;
};

interface GetOrgMemberForWorkspaceProps {
  databases: Databases;
  workspaceId: string;
  userId: string;
}

/**
 * Check if user has organization membership for workspace's org
 * 
 * WHY: Enables org-level permissions to apply to all workspaces in org
 */
export const getOrganizationMemberForWorkspace = async ({
  databases,
  workspaceId,
  userId,
}: GetOrgMemberForWorkspaceProps) => {
  try {
    // Get workspace to check if it has an organizationId
    const workspace = await databases.getDocument(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId
    );

    const organizationId = workspace.organizationId;
    if (!organizationId) {
      return null; // Personal workspace - no org membership possible
    }

    // Check if user is a member of the organization
    const orgMembers = await databases.listDocuments(
      DATABASE_ID,
      ORGANIZATION_MEMBERS_ID,
      [
        Query.equal("organizationId", organizationId),
        Query.equal("userId", userId),
      ]
    );

    return orgMembers.documents[0] || null;
  } catch {
    // Workspace not found or other error
    return null;
  }
};

interface ValidateWorkspaceCreationProps {
  databases: Databases;
  userId: string;
  accountType: "PERSONAL" | "ORG";
}

/**
 * Validate workspace creation limits
 * 
 * CRITICAL RULE (Item 1):
 * IF user.accountType == "PERSONAL"
 * AND count(workspaces WHERE ownerId == user.id AND organizationId IS NULL) >= 1
 * → reject workspace creation with HTTP 403
 * 
 * WHY organizationId IS NULL check:
 * - This rule must NOT affect organization workspaces
 * - Personal accounts can own exactly ONE personal workspace
 * - If user is part of an org workspace (invited), that doesn't count
 * 
 * INVARIANT: PERSONAL accounts can have exactly ONE workspace where they are OWNER
 * ORG accounts have no limit (workspaces belong to organization)
 */
export const validateWorkspaceCreation = async ({
  databases,
  userId,
  accountType,
}: ValidateWorkspaceCreationProps): Promise<{ allowed: boolean; reason?: string }> => {
  if (accountType === "ORG") {
    return { allowed: true }; // No limit for ORG accounts
  }

  // PERSONAL account - check if user already OWNS a personal workspace
  // Step 1: Get all memberships where user has OWNER role
  const existingOwnerships = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
    Query.equal("userId", userId),
    Query.equal("role", "OWNER"),
  ]);

  if (existingOwnerships.total === 0) {
    return { allowed: true }; // No owned workspaces yet
  }

  // Step 2: Check if any of those workspaces are PERSONAL (organizationId IS NULL)
  // We must verify the workspace.organizationId field
  const { WORKSPACES_ID } = await import("@/config");

  for (const membership of existingOwnerships.documents) {
    try {
      const workspace = await databases.getDocument(
        DATABASE_ID,
        WORKSPACES_ID,
        membership.workspaceId
      );

      // If workspace has no organizationId, it's a personal workspace
      // CRITICAL: This means user already has their one allowed personal workspace
      if (!workspace.organizationId) {
        console.log(
          `[WorkspaceValidation] BLOCKED: User ${userId} already owns personal workspace ${workspace.$id}`
        );
        return {
          allowed: false,
          reason: "Personal accounts can only have one workspace. Upgrade to Organization to create more.",
        };
      }
    } catch {
      // Workspace not found - clean up orphaned membership later
      console.warn(`[WorkspaceValidation] Orphaned membership for workspace ${membership.workspaceId}`);
    }
  }

  // User owns workspaces, but they're all organization workspaces
  return { allowed: true };
};

// ===============================
// Membership Inheritance Rules
// ===============================

/**
 * Permission levels for workspace access
 * 
 * WHY separate list vs data access:
 * - Organization membership grants LISTING capability (see workspace exists)
 * - Data ACCESS requires explicit workspace membership
 * - This prevents permission leaks through implicit inheritance
 */
export enum WorkspaceAccessLevel {
  /** Can see workspace exists in list */
  LIST = "list",
  /** Can read workspace data (projects, tasks, etc.) */
  READ = "read",
  /** Can write workspace data */
  WRITE = "write",
  /** Full admin access */
  ADMIN = "admin",
}

interface CanAccessWorkspaceDataProps {
  databases: Databases;
  workspaceId: string;
  userId: string;
  requiredLevel: WorkspaceAccessLevel;
}

/**
 * Check if user can access workspace DATA (not just list)
 * 
 * CRITICAL RULE:
 * - Organization membership allows LISTING workspaces
 * - Organization membership does NOT grant data READ/WRITE access
 * - Data access requires EXPLICIT workspace membership
 * 
 * WHY: Prevents implicit permission inheritance from leaking data.
 * An org admin should be able to see all workspaces exist, but
 * cannot read project/task data unless explicitly added.
 * 
 * @example
 * // Check if user can read project data in workspace
 * const canRead = await canAccessWorkspaceData({
 *   databases,
 *   workspaceId: "ws123",
 *   userId: "user456",
 *   requiredLevel: WorkspaceAccessLevel.READ,
 * });
 * if (!canRead) {
 *   return c.json({ error: "Unauthorized" }, 403);
 * }
 */
export const canAccessWorkspaceData = async ({
  databases,
  workspaceId,
  userId,
  requiredLevel,
}: CanAccessWorkspaceDataProps): Promise<boolean> => {
  // LIST level can use org membership
  if (requiredLevel === WorkspaceAccessLevel.LIST) {
    const member = await getMember({ databases, workspaceId, userId });
    return !!member;
  }

  // For READ/WRITE/ADMIN, require EXPLICIT workspace membership
  // Organization-level membership is NOT sufficient
  const directMember = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
    Query.equal("workspaceId", workspaceId),
    Query.equal("userId", userId),
  ]);

  if (directMember.total === 0) {
    return false;
  }

  const member = directMember.documents[0];

  switch (requiredLevel) {
    case WorkspaceAccessLevel.READ:
      // Any direct member can read
      return true;
    case WorkspaceAccessLevel.WRITE:
      // MEMBER, ADMIN, OWNER can write
      return true;
    case WorkspaceAccessLevel.ADMIN:
      // Only ADMIN or OWNER
      return member.role === "ADMIN" || member.role === "OWNER";
    default:
      return false;
  }
};

/**
 * Check if org member can LIST workspaces in organization
 * (but not access data without explicit membership)
 */
export const canListOrgWorkspaces = async ({
  databases,
  organizationId,
  userId,
}: {
  databases: Databases;
  organizationId: string;
  userId: string;
}): Promise<boolean> => {
  const { ORGANIZATION_MEMBERS_ID } = await import("@/config");

  const orgMember = await databases.listDocuments(
    DATABASE_ID,
    ORGANIZATION_MEMBERS_ID,
    [
      Query.equal("organizationId", organizationId),
      Query.equal("userId", userId),
    ]
  );

  return orgMember.total > 0;
};

