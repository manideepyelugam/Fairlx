import { Models } from "node-appwrite";

/**
 * Project Member - Links a user to a team within a project with a role
 * 
 * Permission Hierarchy:
 * Workspace → Project → Team → Member → Role → Permissions[]
 * 
 * A user can be in multiple teams within the same project.
 * Permissions are merged across all team memberships.
 */
export type ProjectMember = Models.Document & {
    workspaceId: string;    // Parent workspace
    projectId: string;      // Project this membership belongs to
    teamId: string;         // Team within the project
    userId: string;         // User's Appwrite auth ID
    roleId: string;         // Reference to project_roles collection

    // Denormalized for quick access (optional, can be populated)
    roleName?: string;      // Cached role name

    // Metadata
    joinedAt?: string;      // When user joined this team
    addedBy?: string;       // Who added this member
};

/**
 * Project Role - Defines a set of permissions scoped to a project
 * 
 * Roles are project-scoped and NOT global.
 * Each project can have its own set of custom roles.
 */
export type ProjectRole = Models.Document & {
    workspaceId: string;    // Parent workspace
    projectId: string;      // Project this role belongs to
    name: string;           // Role name (e.g., "Project Admin", "QA Lead")
    description?: string;   // Role description
    permissions: string[];  // Array of permission strings (e.g., "task.create")
    color?: string;         // Badge color for UI
    isDefault?: boolean;    // If true, cannot be deleted (built-in role)

    // Audit fields
    createdBy: string;
    lastModifiedBy?: string;
};

/**
 * Populated Project Member with resolved relations
 */
export type PopulatedProjectMember = ProjectMember & {
    user: {
        $id: string;
        userId: string;
        name: string;
        email: string;
        profileImageUrl?: string;
    };
    team: {
        $id: string;
        name: string;
    };
    role: {
        $id: string;
        name: string;
        permissions: string[];
        color?: string;
    };
};

/**
 * Create Project Member DTO
 */
export type CreateProjectMemberData = {
    workspaceId: string;
    projectId: string;
    teamId: string;
    userId: string;
    roleId: string;
};

/**
 * Update Project Member DTO
 */
export type UpdateProjectMemberData = {
    roleId?: string;
    teamId?: string;
};

/**
 * Create Project Role DTO
 */
export type CreateProjectRoleData = {
    workspaceId: string;
    projectId: string;
    name: string;
    description?: string;
    permissions: string[];
    color?: string;
    isDefault?: boolean;
};

/**
 * Update Project Role DTO
 */
export type UpdateProjectRoleData = {
    name?: string;
    description?: string;
    permissions?: string[];
    color?: string;
};

/**
 * User's resolved permissions for a project
 * Used by frontend hooks
 */
export type ProjectPermissionResult = {
    projectId: string;
    userId: string;
    permissions: string[];
    roles: Array<{
        roleId: string;
        roleName: string;
        teamId: string;
        teamName: string;
    }>;
    isProjectAdmin: boolean;
};
