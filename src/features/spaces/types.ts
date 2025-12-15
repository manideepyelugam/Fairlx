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
  ADMIN = "ADMIN",       // Full control over space settings - designated as "MASTER"
  MEMBER = "MEMBER",     // Can create/edit work items
  VIEWER = "VIEWER",     // Read-only access
}

// Space Admin Permissions - MASTER has all permissions
export enum SpacePermission {
  // Space Management
  EDIT_SPACE_SETTINGS = "EDIT_SPACE_SETTINGS",
  DELETE_SPACE = "DELETE_SPACE",
  MANAGE_SPACE_MEMBERS = "MANAGE_SPACE_MEMBERS",
  
  // Team Management within Space
  CREATE_TEAMS = "CREATE_TEAMS",
  DELETE_TEAMS = "DELETE_TEAMS",
  MANAGE_TEAM_SETTINGS = "MANAGE_TEAM_SETTINGS",
  ASSIGN_TEAMS = "ASSIGN_TEAMS",
  
  // Project Management within Space
  CREATE_PROJECTS = "CREATE_PROJECTS",
  DELETE_PROJECTS = "DELETE_PROJECTS",
  MANAGE_PROJECT_SETTINGS = "MANAGE_PROJECT_SETTINGS",
  ASSIGN_PROJECTS = "ASSIGN_PROJECTS",
  
  // Work Item Management
  CREATE_WORK_ITEMS = "CREATE_WORK_ITEMS",
  EDIT_WORK_ITEMS = "EDIT_WORK_ITEMS",
  DELETE_WORK_ITEMS = "DELETE_WORK_ITEMS",
  ASSIGN_WORK_ITEMS = "ASSIGN_WORK_ITEMS",
  
  // View Permissions
  VIEW_SPACE = "VIEW_SPACE",
  VIEW_TEAMS = "VIEW_TEAMS",
  VIEW_PROJECTS = "VIEW_PROJECTS",
  VIEW_WORK_ITEMS = "VIEW_WORK_ITEMS",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
}

// Default permissions for space roles
export const DEFAULT_SPACE_PERMISSIONS: Record<SpaceRole, SpacePermission[]> = {
  [SpaceRole.ADMIN]: Object.values(SpacePermission), // MASTER - All permissions
  [SpaceRole.MEMBER]: [
    SpacePermission.VIEW_SPACE,
    SpacePermission.VIEW_TEAMS,
    SpacePermission.VIEW_PROJECTS,
    SpacePermission.VIEW_WORK_ITEMS,
    SpacePermission.CREATE_WORK_ITEMS,
    SpacePermission.EDIT_WORK_ITEMS,
  ],
  [SpaceRole.VIEWER]: [
    SpacePermission.VIEW_SPACE,
    SpacePermission.VIEW_TEAMS,
    SpacePermission.VIEW_PROJECTS,
    SpacePermission.VIEW_WORK_ITEMS,
  ],
};

// Get display name for space role
export const getSpaceRoleDisplay = (role: SpaceRole): { label: string; description: string; color: string } => {
  switch (role) {
    case SpaceRole.ADMIN:
      return {
        label: "Master",
        description: "Full control over space, teams, and projects",
        color: "from-amber-500 to-orange-600",
      };
    case SpaceRole.MEMBER:
      return {
        label: "Member",
        description: "Can create and edit work items",
        color: "from-blue-500 to-indigo-600",
      };
    case SpaceRole.VIEWER:
      return {
        label: "Viewer",
        description: "Read-only access to space content",
        color: "from-slate-400 to-slate-600",
      };
    default:
      return {
        label: "Unknown",
        description: "Unknown role",
        color: "from-gray-400 to-gray-600",
      };
  }
};

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
  teamCount?: number;
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
