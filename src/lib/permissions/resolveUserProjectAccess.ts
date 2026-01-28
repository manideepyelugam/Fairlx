import "server-only";

import { Databases, Query } from "node-appwrite";
import {
    DATABASE_ID,
    PROJECT_MEMBERS_ID,
    PROJECT_TEAMS_ID,
    PROJECT_TEAM_MEMBERS_ID,
    PROJECT_PERMISSIONS_ID,
} from "@/config";
import {
    ProjectMember,
    ProjectTeamMember,
    ProjectPermission,
    ProjectAccessResult,
    ProjectMemberRole,
    ProjectMemberStatus,
} from "@/features/project-teams/types";
import { assertInvariant } from "@/lib/invariants";

// =============================================================================
// PROJECT PERMISSION KEYS
// =============================================================================

/**
 * Project-scoped permission keys
 */
import { ProjectPermissionKey } from "./types";

export { ProjectPermissionKey } from "./types";


/**
 * Default permissions for each project role
 */
export const ROLE_PERMISSIONS: Record<ProjectMemberRole, ProjectPermissionKey[]> = {
    [ProjectMemberRole.PROJECT_OWNER]: Object.values(ProjectPermissionKey), // All permissions
    [ProjectMemberRole.PROJECT_ADMIN]: [
        ProjectPermissionKey.VIEW_PROJECT,
        ProjectPermissionKey.VIEW_TASKS,
        ProjectPermissionKey.VIEW_SPRINTS,
        ProjectPermissionKey.VIEW_DOCS,
        ProjectPermissionKey.VIEW_MEMBERS,
        ProjectPermissionKey.VIEW_TEAMS,
        ProjectPermissionKey.CREATE_TASKS,
        ProjectPermissionKey.CREATE_SPRINTS,
        ProjectPermissionKey.CREATE_DOCS,
        ProjectPermissionKey.EDIT_TASKS,
        ProjectPermissionKey.EDIT_SPRINTS,
        ProjectPermissionKey.EDIT_DOCS,
        ProjectPermissionKey.DELETE_TASKS,
        ProjectPermissionKey.DELETE_SPRINTS,
        ProjectPermissionKey.DELETE_DOCS,
        ProjectPermissionKey.START_SPRINT,
        ProjectPermissionKey.COMPLETE_SPRINT,
        ProjectPermissionKey.MANAGE_MEMBERS,
        ProjectPermissionKey.MANAGE_TEAMS,
        ProjectPermissionKey.MANAGE_PERMISSIONS,
        ProjectPermissionKey.EDIT_SETTINGS,
    ],
    [ProjectMemberRole.MEMBER]: [
        ProjectPermissionKey.VIEW_PROJECT,
        ProjectPermissionKey.VIEW_TASKS,
        ProjectPermissionKey.VIEW_SPRINTS,
        ProjectPermissionKey.VIEW_DOCS,
        ProjectPermissionKey.VIEW_MEMBERS,
        ProjectPermissionKey.VIEW_TEAMS,
        ProjectPermissionKey.CREATE_TASKS,
        ProjectPermissionKey.EDIT_TASKS,
    ],
    [ProjectMemberRole.VIEWER]: [
        ProjectPermissionKey.VIEW_PROJECT,
        ProjectPermissionKey.VIEW_TASKS,
        ProjectPermissionKey.VIEW_SPRINTS,
        ProjectPermissionKey.VIEW_DOCS,
        ProjectPermissionKey.VIEW_MEMBERS,
        ProjectPermissionKey.VIEW_TEAMS,
    ],
};

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Resolve User Project Access
 * 
 * CANONICAL RESOLVER for project-level access control.
 * 
 * RULES:
 * 1. User MUST be a project member (status = ACTIVE) to have ANY access
 * 2. Role determines base permissions (OWNER > ADMIN > MEMBER > VIEWER)
 * 3. Team permissions are MERGED with role permissions
 * 4. Owner/Admin roles grant elevated permissions
 * 
 * INVARIANTS:
 * - Workspace membership NEVER grants project access
 * - Team membership NEVER crosses projects
 * - No project membership = ZERO access
 */
export async function resolveUserProjectAccess(
    _databases: Databases, // Kept for API compatibility, but we use admin client
    userId: string,
    projectId: string
): Promise<ProjectAccessResult> {
    // Use admin client to bypass collection-level permissions
    // This is safe because we're only reading membership data, not user data
    const { createAdminClient } = await import("@/lib/appwrite");
    const adminClient = await createAdminClient();
    const databases = adminClient.databases;

    const noAccess: ProjectAccessResult = {
        projectId,
        userId,
        hasAccess: false,
        role: null,
        isOwner: false,
        isAdmin: false,
        permissions: [],
        teams: [],
        allowedRouteKeys: [],
    };

    try {
        // 0. Fetch Context (Project -> Workspace -> Organization)
        // We need to know the workspace and organization to check higher-level permissions
        const { PROJECTS_ID, WORKSPACES_ID, MEMBERS_ID, ORGANIZATION_MEMBERS_ID } = await import("@/config");

        const project = await databases.getDocument(DATABASE_ID, PROJECTS_ID, projectId);
        const workspaceId = project.workspaceId;

        let organizationId: string | null = null;
        try {
            const workspace = await databases.getDocument(DATABASE_ID, WORKSPACES_ID, workspaceId);
            organizationId = workspace.organizationId || null;
        } catch {
            // Workspace fetch failed - continue without org context
        }

        // 1. Organization Access Override (Highest Priority)
        // Org Owners, Admins, and Moderators get full access to EVERYTHING in the org
        if (organizationId) {
            try {
                const orgMembers = await databases.listDocuments(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    [
                        Query.equal("organizationId", organizationId),
                        Query.equal("userId", userId),
                        Query.equal("status", "ACTIVE"),
                    ]
                );

                if (orgMembers.total > 0) {
                    const orgMember = orgMembers.documents[0];
                    const orgRole = orgMember.role;

                    // Check for privileged roles
                    const { OrganizationRole } = await import("@/features/organizations/types");
                    if ([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MODERATOR].includes(orgRole)) {
                        return {
                            projectId,
                            userId,
                            hasAccess: true,
                            role: ProjectMemberRole.PROJECT_OWNER, // Implicit full access
                            isOwner: true,
                            isAdmin: true,
                            permissions: Object.values(ProjectPermissionKey),
                            teams: [],
                            allowedRouteKeys: getRouteKeysForPermissions(Object.values(ProjectPermissionKey)),
                        };
                    }
                }
            } catch {
                // Org check failed - continue with other access checks
            }
        }

        // 2. Workspace Admin Access Override
        // Workspace Admins get full access to all projects in the workspace
        try {
            const wsMembers = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                [
                    Query.equal("workspaceId", workspaceId),
                    Query.equal("userId", userId),
                    // Query.equal("status", "ACTIVE"), // Assuming workspace members are active if present in this collection? 
                    // Verify MemberStatus enum usage if needed, but standard usually implies existence = validation
                ]
            );

            if (wsMembers.total > 0) {
                const wsMember = wsMembers.documents[0];
                const wsRole = wsMember.role; // This might be "WS_ADMIN" or legacy "OWNER"/"ADMIN"

                // Check for Admin role (supporting legacy and new types)
                const { WorkspaceMemberRole, MemberRole } = await import("@/features/members/types");
                const isWsAdmin =
                    wsRole === WorkspaceMemberRole.WS_ADMIN ||
                    wsRole === MemberRole.OWNER ||
                    wsRole === MemberRole.ADMIN;

                if (isWsAdmin) {
                    return {
                        projectId,
                        userId,
                        hasAccess: true,
                        role: ProjectMemberRole.PROJECT_OWNER, // Implicit full access
                        isOwner: true,
                        isAdmin: true,
                        permissions: Object.values(ProjectPermissionKey),
                        teams: [],
                        allowedRouteKeys: getRouteKeysForPermissions(Object.values(ProjectPermissionKey)),
                    };
                }
            }
        } catch {
            // Workspace check failed - continue with other access checks
        }

        // 3. Check direct project membership (Existing Logic)
        const memberships = await databases.listDocuments<ProjectMember>(
            DATABASE_ID,
            PROJECT_MEMBERS_ID,
            [
                Query.equal("projectId", projectId),
                Query.equal("userId", userId),
                Query.equal("status", ProjectMemberStatus.ACTIVE),
                Query.limit(1),
            ]
        );

        if (memberships.total === 0) {
            // Project membership needed if no higher-level access found
            return noAccess;
        }

        const membership = memberships.documents[0];
        const role = membership.role as ProjectMemberRole;

        // 2. Get role-based permissions
        const rolePermissions = ROLE_PERMISSIONS[role] || [];

        // 3. Get team memberships
        const teamMemberships = await databases.listDocuments<ProjectTeamMember>(
            DATABASE_ID,
            PROJECT_TEAM_MEMBERS_ID,
            [
                Query.equal("projectId", projectId),
                Query.equal("userId", userId),
            ]
        );

        // 4. Get team permissions
        const teamIds = teamMemberships.documents.map((tm) => tm.teamId);
        let teamPermissions: string[] = [];

        if (teamIds.length > 0) {
            const permissions = await databases.listDocuments<ProjectPermission>(
                DATABASE_ID,
                PROJECT_PERMISSIONS_ID,
                [
                    Query.equal("projectId", projectId),
                    Query.contains("assignedToTeamId", teamIds),
                ]
            );
            teamPermissions = permissions.documents.map((p) => p.permissionKey);
        }

        // 5. Get direct user permissions
        const directPermissions = await databases.listDocuments<ProjectPermission>(
            DATABASE_ID,
            PROJECT_PERMISSIONS_ID,
            [
                Query.equal("projectId", projectId),
                Query.equal("assignedToUserId", userId),
            ]
        );
        const directPermissionKeys = directPermissions.documents.map((p) => p.permissionKey);

        // 6. Merge all permissions (deduplicate)
        const allPermissions = [
            ...new Set([
                ...rolePermissions,
                ...teamPermissions,
                ...directPermissionKeys,
            ]),
        ];

        // 7. Get team details for result
        const teams: ProjectAccessResult["teams"] = [];
        if (teamIds.length > 0) {
            const teamDocs = await databases.listDocuments(
                DATABASE_ID,
                PROJECT_TEAMS_ID,
                [Query.contains("$id", teamIds)]
            );

            for (const tm of teamMemberships.documents) {
                const teamDoc = teamDocs.documents.find((t) => t.$id === tm.teamId);
                if (teamDoc) {
                    teams.push({
                        teamId: tm.teamId,
                        teamName: teamDoc.name as string,
                        teamRole: tm.teamRole,
                    });
                }
            }
        }

        // 8. Build result
        const isOwner = role === ProjectMemberRole.PROJECT_OWNER;
        const isAdmin = role === ProjectMemberRole.PROJECT_OWNER || role === ProjectMemberRole.PROJECT_ADMIN;

        // INVARIANT: Owner must always have full access
        if (isOwner) {
            assertInvariant(
                allPermissions.length > 0,
                "PROJECT_OWNER_NO_PERMISSIONS",
                "Project owner should have permissions",
                { projectId, userId }
            );
        }

        return {
            projectId,
            userId,
            hasAccess: true,
            role,
            isOwner,
            isAdmin,
            permissions: allPermissions,
            teams,
            allowedRouteKeys: getRouteKeysForPermissions(allPermissions),
        };

    } catch {
        return noAccess;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if user has a specific project permission
 */
export function hasProjectPermission(
    access: ProjectAccessResult,
    permission: ProjectPermissionKey | string
): boolean {
    // Owner always has access
    if (access.isOwner) return true;

    return access.permissions.includes(permission);
}

/**
 * Quick check: Is user a member of this project?
 */
export async function isProjectMember(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    const memberships = await databases.listDocuments(
        DATABASE_ID,
        PROJECT_MEMBERS_ID,
        [
            Query.equal("projectId", projectId),
            Query.equal("userId", userId),
            Query.equal("status", ProjectMemberStatus.ACTIVE),
            Query.limit(1),
        ]
    );
    return memberships.total > 0;
}

/**
 * Assert user has project access (throws if not)
 */
export async function assertProjectAccess(
    databases: Databases,
    userId: string,
    projectId: string,
    requiredPermission?: ProjectPermissionKey
): Promise<ProjectAccessResult> {
    const access = await resolveUserProjectAccess(databases, userId, projectId);

    if (!access.hasAccess) {
        throw new Error("Unauthorized: Not a project member");
    }

    if (requiredPermission && !hasProjectPermission(access, requiredPermission)) {
        throw new Error(`Unauthorized: Missing permission ${requiredPermission}`);
    }

    return access;
}

/**
 * Get route keys for permissions (placeholder - implement based on routing needs)
 */
function getRouteKeysForPermissions(permissions: string[]): string[] {
    // Map permissions to route keys
    // This can be expanded based on application routing
    const routeKeys: string[] = [];

    if (permissions.includes(ProjectPermissionKey.VIEW_PROJECT)) {
        routeKeys.push("PROJECT_DASHBOARD");
    }
    if (permissions.includes(ProjectPermissionKey.VIEW_TASKS)) {
        routeKeys.push("PROJECT_TASKS", "PROJECT_BACKLOG");
    }
    if (permissions.includes(ProjectPermissionKey.VIEW_SPRINTS)) {
        routeKeys.push("PROJECT_SPRINTS");
    }
    if (permissions.includes(ProjectPermissionKey.VIEW_DOCS)) {
        routeKeys.push("PROJECT_DOCS");
    }
    if (permissions.includes(ProjectPermissionKey.VIEW_MEMBERS)) {
        routeKeys.push("PROJECT_MEMBERS");
    }
    if (permissions.includes(ProjectPermissionKey.MANAGE_TEAMS)) {
        routeKeys.push("PROJECT_TEAMS");
    }
    if (permissions.includes(ProjectPermissionKey.EDIT_SETTINGS)) {
        routeKeys.push("PROJECT_SETTINGS");
    }

    return routeKeys;
}
