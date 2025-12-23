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
 * INVARIANT: PERSONAL accounts can have exactly ONE workspace
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

  // PERSONAL account - check if user already has a workspace
  const existingMembers = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
    Query.equal("userId", userId),
  ]);

  if (existingMembers.total >= 1) {
    return {
      allowed: false,
      reason: "Personal accounts can only have one workspace. Upgrade to Organization to create more.",
    };
  }

  return { allowed: true };
};

