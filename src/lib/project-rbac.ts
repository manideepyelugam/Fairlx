import { Databases, Query } from "node-appwrite";
import { DATABASE_ID, PROJECT_MEMBERS_ID, PROJECT_ROLES_ID, MEMBERS_ID } from "@/config";
import { ProjectMember, ProjectRole, ProjectPermissionResult } from "@/features/project-members/types";
import { PROJECT_PERMISSIONS, DEFAULT_PROJECT_ROLES } from "./project-permissions";
import { MemberRole } from "@/features/members/types";

/**
 * Central Permission Resolver for Project-Scoped RBAC
 * 
 * Resolution Logic:
 * 1. Fetch ALL project_members for (userId + projectId)
 * 2. For each membership, resolve roleId → permissions[]
 * 3. Merge permissions (union) if user is in multiple teams
 * 4. Return TRUE if ANY role grants the permission
 * 5. NO workspace fallback (except for workspace admins if enabled)
 * 
 * Backend is the source of truth.
 */

/**
 * Retrieves the merged permissions for a user in a specific project.
 * 
 * @param databases - Appwrite Databases instance
 * @param userId - The user's Appwrite auth ID
 * @param projectId - The project ID to check permissions for
 * @param options - Optional settings (e.g., workspace admin bypass)
 * @returns Array of permission strings the user has in this project
 */
export async function getProjectPermissions(
    databases: Databases,
    userId: string,
    projectId: string,
    options?: {
        workspaceId?: string;
        allowWorkspaceAdminOverride?: boolean;
    }
): Promise<string[]> {
    try {
        // If workspace admin override is enabled, check if user is workspace admin
        if (options?.workspaceId && options?.allowWorkspaceAdminOverride) {
            const isWorkspaceAdmin = await checkWorkspaceAdmin(
                databases,
                options.workspaceId,
                userId
            );
            if (isWorkspaceAdmin) {
                // Workspace admins get all permissions (super-admin bypass)
                return Object.values(PROJECT_PERMISSIONS);
            }
        }

        // Fetch all project memberships for this user in this project
        const memberships = await databases.listDocuments<ProjectMember>(
            DATABASE_ID,
            PROJECT_MEMBERS_ID,
            [
                Query.equal("userId", userId),
                Query.equal("projectId", projectId),
            ]
        );

        if (memberships.total === 0) {
            console.log(`[Project-RBAC] No memberships found for user ${userId} in project ${projectId}`);
            return [];
        }

        // Collect all role IDs
        const roleIds = [...new Set(memberships.documents.map((m) => m.roleId))];

        // Fetch all roles
        const roles = await databases.listDocuments<ProjectRole>(
            DATABASE_ID,
            PROJECT_ROLES_ID,
            [Query.equal("$id", roleIds)]
        );

        // Merge all permissions from all roles (union)
        const allPermissions = new Set<string>();
        for (const role of roles.documents) {
            for (const permission of role.permissions || []) {
                allPermissions.add(permission);
            }
        }

        console.log(`[Project-RBAC] User ${userId} in project ${projectId} has ${allPermissions.size} permissions from ${roleIds.length} role(s)`);

        return Array.from(allPermissions);
    } catch (error) {
        console.error("[Project-RBAC] Error getting project permissions:", error);
        return [];
    }
}

/**
 * Checks if a user has a specific permission in a project.
 * 
 * @param databases - Appwrite Databases instance
 * @param userId - The user's Appwrite auth ID
 * @param projectId - The project ID to check
 * @param permission - The permission string to check
 * @param options - Optional settings
 * @returns True if user has the permission, false otherwise
 */
export async function canProject(
    databases: Databases,
    userId: string,
    projectId: string,
    permission: string,
    options?: {
        workspaceId?: string;
        allowWorkspaceAdminOverride?: boolean;
    }
): Promise<boolean> {
    const permissions = await getProjectPermissions(databases, userId, projectId, options);
    return permissions.includes(permission);
}

/**
 * Gets detailed permission result including role information.
 * Useful for frontend hooks that need role context.
 */
export async function getProjectPermissionResult(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<ProjectPermissionResult> {
    try {
        // Fetch all project memberships
        const memberships = await databases.listDocuments<ProjectMember>(
            DATABASE_ID,
            PROJECT_MEMBERS_ID,
            [
                Query.equal("userId", userId),
                Query.equal("projectId", projectId),
            ]
        );

        if (memberships.total === 0) {
            return {
                projectId,
                userId,
                permissions: [],
                roles: [],
                isProjectAdmin: false,
            };
        }

        // Collect role IDs and team IDs
        const roleIds = [...new Set(memberships.documents.map((m) => m.roleId))];

        // Fetch roles
        const roles = await databases.listDocuments<ProjectRole>(
            DATABASE_ID,
            PROJECT_ROLES_ID,
            [Query.equal("$id", roleIds)]
        );

        // Build role-to-team mapping
        const roleInfos: ProjectPermissionResult["roles"] = [];
        const allPermissions = new Set<string>();

        for (const membership of memberships.documents) {
            const role = roles.documents.find((r) => r.$id === membership.roleId);
            if (role) {
                roleInfos.push({
                    roleId: role.$id,
                    roleName: role.name,
                    teamId: membership.teamId,
                    teamName: membership.teamId, // Will be populated by caller if needed
                });
                for (const permission of role.permissions || []) {
                    allPermissions.add(permission);
                }
            }
        }

        // Check if user is a project admin (has all permissions from default Project Admin role)
        const projectAdminPermissions = DEFAULT_PROJECT_ROLES.PROJECT_ADMIN.permissions;
        const isProjectAdmin = projectAdminPermissions.every((p) => allPermissions.has(p));

        return {
            projectId,
            userId,
            permissions: Array.from(allPermissions),
            roles: roleInfos,
            isProjectAdmin,
        };
    } catch (error) {
        console.error("[Project-RBAC] Error getting permission result:", error);
        return {
            projectId,
            userId,
            permissions: [],
            roles: [],
            isProjectAdmin: false,
        };
    }
}

/**
 * Helper to check if a user is a workspace admin.
 * Used for workspace admin override feature.
 */
async function checkWorkspaceAdmin(
    databases: Databases,
    workspaceId: string,
    userId: string
): Promise<boolean> {
    try {
        const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", userId),
        ]);

        if (members.total === 0) return false;

        const member = members.documents[0];
        return member.role === MemberRole.ADMIN || member.role === "OWNER";
    } catch {
        return false;
    }
}

/**
 * Checks if a user has any access to a project (is member of any team).
 */
export async function isProjectMember(
    databases: Databases,
    userId: string,
    projectId: string
): Promise<boolean> {
    try {
        const memberships = await databases.listDocuments<ProjectMember>(
            DATABASE_ID,
            PROJECT_MEMBERS_ID,
            [
                Query.equal("userId", userId),
                Query.equal("projectId", projectId),
                Query.limit(1),
            ]
        );

        return memberships.total > 0;
    } catch {
        return false;
    }
}

/**
 * Gets all project IDs a user has access to.
 * Useful for filtering project lists.
 */
export async function getUserProjectIds(
    databases: Databases,
    userId: string,
    workspaceId?: string
): Promise<string[]> {
    try {
        const queries = [Query.equal("userId", userId)];
        if (workspaceId) {
            queries.push(Query.equal("workspaceId", workspaceId));
        }

        const memberships = await databases.listDocuments<ProjectMember>(
            DATABASE_ID,
            PROJECT_MEMBERS_ID,
            queries
        );

        // Return unique project IDs
        return [...new Set(memberships.documents.map((m) => m.projectId))];
    } catch {
        return [];
    }
}
