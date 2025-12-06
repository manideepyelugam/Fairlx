import { Models } from "node-appwrite";

// Space visibility options
export enum SpaceVisibility {
  PUBLIC = "PUBLIC",     // Visible to all workspace members
  PRIVATE = "PRIVATE",   // Invite only
}

// Space type templates for quick setup
export enum SpaceTemplate {
  SOFTWARE = "SOFTWARE",           // Software development (Scrum/Kanban)
  KANBAN_ONLY = "KANBAN_ONLY",     // Pure Kanban flow
  MARKETING = "MARKETING",          // Marketing campaigns
  OPERATIONS = "OPERATIONS",        // Operations & support
  CUSTOM = "CUSTOM",               // Custom configuration
}

// Space entity - logical container between Workspace and Projects
export type Space = Models.Document & {
  name: string;
  key: string;                      // Short key like "ENG", "MKT" for work item prefixes
  description?: string | null;
  workspaceId: string;
  visibility: SpaceVisibility;
  template: SpaceTemplate;
  imageUrl?: string | null;
  color?: string | null;            // Theme color for the space
  ownerId: string;                  // Space owner (creator)
  defaultWorkflowId?: string | null; // Default workflow for new projects
  position: number;                 // For ordering
  archived: boolean;
};

// Space member with role
export enum SpaceRole {
  ADMIN = "ADMIN",       // Full control over space settings
  MEMBER = "MEMBER",     // Can create/edit work items
  VIEWER = "VIEWER",     // Read-only access
}

export type SpaceMember = Models.Document & {
  spaceId: string;
  memberId: string;      // Reference to workspace member
  userId: string;        // User ID for quick lookups
  role: SpaceRole;
  joinedAt: string;
};

// Populated types for UI
export type PopulatedSpace = Space & {
  memberCount?: number;
  projectCount?: number;
  owner?: {
    $id: string;
    name: string;
    email?: string;
  };
};

export type PopulatedSpaceMember = SpaceMember & {
  user?: {
    $id: string;
    name: string;
    email?: string;
    profileImageUrl?: string | null;
  };
};
