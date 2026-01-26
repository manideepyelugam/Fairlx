import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import {
    DATABASE_ID,
    PROJECT_MEMBERS_ID,
    PROJECT_ROLES_ID,
    TEAMS_ID,
} from "@/config";
import {
    getProjectPermissionResult,
    canProject,
} from "@/lib/project-rbac";
import { PROJECT_PERMISSIONS } from "@/lib/project-permissions";
import { ProjectMember, ProjectRole, PopulatedProjectMember } from "../types";
import {
    createProjectMemberSchema,
    updateProjectMemberSchema,
    getProjectMembersSchema,
    getPermissionsSchema,
    createProjectRoleSchema,
    updateProjectRoleSchema,
    getProjectRolesSchema,
} from "../schemas";

const app = new Hono()
    /**
     * GET /api/project-members/permissions
     * Get current user's permissions for a project
     */
    .get(
        "/permissions",
        sessionMiddleware,
        zValidator("query", getPermissionsSchema),
        async (c) => {
            const { databases: adminDb } = await createAdminClient();
            const user = c.get("user");
            const { projectId } = c.req.valid("query");

            const result = await getProjectPermissionResult(
                adminDb,
                user.$id,
                projectId
            );

            return c.json({ data: result });
        }
    )

    /**
     * GET /api/project-members/current
     * Get current user's memberships in a project
     */
    .get(
        "/current",
        sessionMiddleware,
        zValidator("query", getPermissionsSchema),
        async (c) => {
            const { users, databases: adminDb } = await createAdminClient();
            const user = c.get("user");
            const { projectId } = c.req.valid("query");

            const memberships = await adminDb.listDocuments<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                [
                    Query.equal("userId", user.$id),
                    Query.equal("projectId", projectId),
                ]
            );

            if (memberships.total === 0) {
                return c.json({ data: [] });
            }

            // Populate with team and role info
            const populated: PopulatedProjectMember[] = await Promise.all(
                memberships.documents.map(async (membership) => {
                    // Get team
                    const team = await adminDb.getDocument(
                        DATABASE_ID,
                        TEAMS_ID,
                        membership.teamId
                    ).catch(() => ({ $id: membership.teamId, name: "Unknown" }));

                    // Get role
                    const role = await adminDb.getDocument<ProjectRole>(
                        DATABASE_ID,
                        PROJECT_ROLES_ID,
                        membership.roleId
                    ).catch(() => ({
                        $id: membership.roleId,
                        name: "Unknown",
                        permissions: [] as string[],
                        color: undefined,
                    }));

                    // Get user info
                    const userInfo = await users.get(membership.userId).catch(() => null);

                    return {
                        ...membership,
                        user: {
                            $id: membership.userId,
                            userId: membership.userId,
                            name: userInfo?.name || "Unknown",
                            email: userInfo?.email || "",
                            profileImageUrl: userInfo?.prefs?.profileImageUrl,
                        },
                        team: {
                            $id: team.$id,
                            name: team.name as string,
                        },
                        role: {
                            $id: role.$id,
                            name: role.name,
                            permissions: role.permissions || [],
                            color: role.color,
                        },
                    };
                })
            );

            return c.json({ data: populated });
        }
    )

    /**
     * GET /api/project-members
     * List all members in a project (optionally filter by team)
     */
    .get(
        "/",
        sessionMiddleware,
        zValidator("query", getProjectMembersSchema),
        async (c) => {
            const { users, databases: adminDb } = await createAdminClient();
            const user = c.get("user");
            const { projectId, teamId, workspaceId } = c.req.valid("query");

            // Check if user has permission to view members
            // Use Admin DB for permission check to avoid catch-22
            const hasPermission = await canProject(
                adminDb,
                user.$id,
                projectId,
                PROJECT_PERMISSIONS.PROJECT_VIEW,
                { workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            // Build query
            const queries = [Query.equal("projectId", projectId)];
            if (teamId) {
                queries.push(Query.equal("teamId", teamId));
            }

            const memberships = await adminDb.listDocuments<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                queries
            );

            // Populate members
            const populated: PopulatedProjectMember[] = await Promise.all(
                memberships.documents.map(async (membership) => {
                    const team = await adminDb.getDocument(
                        DATABASE_ID,
                        TEAMS_ID,
                        membership.teamId
                    ).catch(() => ({ $id: membership.teamId, name: "Unknown" }));

                    const role = await adminDb.getDocument<ProjectRole>(
                        DATABASE_ID,
                        PROJECT_ROLES_ID,
                        membership.roleId
                    ).catch(() => ({
                        $id: membership.roleId,
                        name: "Unknown",
                        permissions: [] as string[],
                        color: undefined,
                    }));

                    const userInfo = await users.get(membership.userId).catch(() => null);

                    return {
                        ...membership,
                        user: {
                            $id: membership.userId,
                            userId: membership.userId,
                            name: userInfo?.name || "Unknown",
                            email: userInfo?.email || "",
                            profileImageUrl: userInfo?.prefs?.profileImageUrl,
                        },
                        team: {
                            $id: team.$id,
                            name: team.name as string,
                        },
                        role: {
                            $id: role.$id,
                            name: role.name,
                            permissions: role.permissions || [],
                            color: role.color,
                        },
                    };
                })
            );

            return c.json({ data: { documents: populated, total: memberships.total } });
        }
    )

    /**
     * POST /api/project-members
     * Add a member to a project team with a role
     */
    .post(
        "/",
        sessionMiddleware,
        zValidator("json", createProjectMemberSchema),
        async (c) => {
            // Remove databases from user client, we need adminDb
            const { databases: adminDb } = await createAdminClient();
            const user = c.get("user");
            const data = c.req.valid("json");

            // Check permission to invite members
            const hasPermission = await canProject(
                adminDb,
                user.$id,
                data.projectId,
                PROJECT_PERMISSIONS.MEMBER_INVITE,
                { workspaceId: data.workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized. You cannot invite members to this project." }, 403);
            }

            // Check if user is already a member of this project (and team if specified)
            const existingQueries = [
                Query.equal("userId", data.userId),
                Query.equal("projectId", data.projectId),
            ];
            // If teamId is provided, check for duplicate team membership
            // If no teamId, check for any existing membership in project
            if (data.teamId && data.teamId !== "__none__") {
                existingQueries.push(Query.equal("teamId", data.teamId));
            }

            const existing = await adminDb.listDocuments<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                existingQueries
            );

            if (existing.total > 0) {
                // If teamId specified, they're already in the team
                // If no teamId, they're already a project member
                const errorMsg = data.teamId && data.teamId !== "__none__"
                    ? "User is already a member of this team"
                    : "User is already a project member";
                return c.json({ error: errorMsg }, 400);
            }

            // Verify role exists and belongs to this project
            const role = await adminDb.getDocument<ProjectRole>(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                data.roleId
            ).catch(() => null);

            if (!role || role.projectId !== data.projectId) {
                return c.json({ error: "Invalid role for this project" }, 400);
            }

            // Create membership
            const membership = await adminDb.createDocument<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                ID.unique(),
                {
                    workspaceId: data.workspaceId,
                    projectId: data.projectId,
                    // Appwrite requires teamId field - use empty string for "no team"
                    teamId: data.teamId && data.teamId !== "__none__" ? data.teamId : "",
                    userId: data.userId,
                    roleId: data.roleId,
                    roleName: role.name,
                    joinedAt: new Date().toISOString(),
                    addedBy: user.$id,
                }
            );

            return c.json({ data: membership }, 201);
        }
    )

    /**
     * PATCH /api/project-members/:memberId
     * Update a member's role or team
     */
    .patch(
        "/:memberId",
        sessionMiddleware,
        zValidator("json", updateProjectMemberSchema),
        async (c) => {
            const { databases: adminDb } = await createAdminClient();
            const user = c.get("user");
            const { memberId } = c.req.param();
            const updates = c.req.valid("json");

            // Get the membership to update
            const membership = await adminDb.getDocument<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                memberId
            );

            // Check permission
            const hasPermission = await canProject(
                adminDb,
                user.$id,
                membership.projectId,
                PROJECT_PERMISSIONS.MEMBER_INVITE, // Same permission for role changes
                { workspaceId: membership.workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized" }, 403);
            }

            // If changing role, verify it exists
            let roleName = membership.roleName;
            if (updates.roleId) {
                const role = await adminDb.getDocument<ProjectRole>(
                    DATABASE_ID,
                    PROJECT_ROLES_ID,
                    updates.roleId
                ).catch(() => null);

                if (!role || role.projectId !== membership.projectId) {
                    return c.json({ error: "Invalid role for this project" }, 400);
                }
                roleName = role.name;
            }

            const updated = await adminDb.updateDocument<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                memberId,
                {
                    ...updates,
                    roleName,
                }
            );

            return c.json({ data: updated });
        }
    )

    /**
     * DELETE /api/project-members/:memberId
     * Remove a member from a project team
     */
    .delete(
        "/:memberId",
        sessionMiddleware,
        async (c) => {
            const { databases: adminDb } = await createAdminClient();
            const user = c.get("user");
            const { memberId } = c.req.param();

            const membership = await adminDb.getDocument<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                memberId
            );

            // Check permission
            const hasPermission = await canProject(
                adminDb,
                user.$id,
                membership.projectId,
                PROJECT_PERMISSIONS.MEMBER_REMOVE,
                { workspaceId: membership.workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized" }, 403);
            }

            await adminDb.deleteDocument(DATABASE_ID, PROJECT_MEMBERS_ID, memberId);

            return c.json({ data: { $id: memberId } });
        }
    )

    /**
     * GET /api/project-members/roles
     * List all roles for a project
     */
    .get(
        "/roles",
        sessionMiddleware,
        zValidator("query", getProjectRolesSchema),
        async (c) => {
            const { databases: adminDb } = await createAdminClient();
            const user = c.get("user");
            const { projectId, workspaceId } = c.req.valid("query");

            // Check basic project access
            const hasPermission = await canProject(
                adminDb,
                user.$id,
                projectId,
                PROJECT_PERMISSIONS.PROJECT_VIEW,
                { workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const roles = await adminDb.listDocuments<ProjectRole>(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                [Query.equal("projectId", projectId)]
            );

            return c.json({ data: roles });
        }
    )

    /**
     * POST /api/project-members/roles
     * Create a new role for a project
     */
    .post(
        "/roles",
        sessionMiddleware,
        zValidator("json", createProjectRoleSchema),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const data = c.req.valid("json");

            // Check permission to create roles
            const hasPermission = await canProject(
                databases,
                user.$id,
                data.projectId,
                PROJECT_PERMISSIONS.ROLE_CREATE,
                { workspaceId: data.workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized. Cannot create roles in this project." }, 403);
            }

            // Check for duplicate name
            const existing = await databases.listDocuments<ProjectRole>(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                [
                    Query.equal("projectId", data.projectId),
                    Query.equal("name", data.name),
                ]
            );

            if (existing.total > 0) {
                return c.json({ error: "A role with this name already exists" }, 400);
            }

            const role = await databases.createDocument<ProjectRole>(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                ID.unique(),
                {
                    ...data,
                    createdBy: user.$id,
                }
            );

            return c.json({ data: role }, 201);
        }
    )

    /**
     * PATCH /api/project-members/roles/:roleId
     * Update a role's name or permissions
     */
    .patch(
        "/roles/:roleId",
        sessionMiddleware,
        zValidator("json", updateProjectRoleSchema),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { roleId } = c.req.param();
            const updates = c.req.valid("json");

            const role = await databases.getDocument<ProjectRole>(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                roleId
            );

            // Check permission
            const hasPermission = await canProject(
                databases,
                user.$id,
                role.projectId,
                PROJECT_PERMISSIONS.ROLE_UPDATE,
                { workspaceId: role.workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized" }, 403);
            }

            // Prevent editing default roles' core properties
            if (role.isDefault && updates.name) {
                return c.json({ error: "Cannot rename default roles" }, 400);
            }

            const updated = await databases.updateDocument<ProjectRole>(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                roleId,
                {
                    ...updates,
                    lastModifiedBy: user.$id,
                }
            );

            return c.json({ data: updated });
        }
    )

    /**
     * DELETE /api/project-members/roles/:roleId
     * Delete a custom role
     */
    .delete(
        "/roles/:roleId",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { roleId } = c.req.param();

            const role = await databases.getDocument<ProjectRole>(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                roleId
            );

            // Check permission
            const hasPermission = await canProject(
                databases,
                user.$id,
                role.projectId,
                PROJECT_PERMISSIONS.ROLE_DELETE,
                { workspaceId: role.workspaceId, allowWorkspaceAdminOverride: true }
            );

            if (!hasPermission) {
                return c.json({ error: "Unauthorized" }, 403);
            }

            // Prevent deleting default roles
            if (role.isDefault) {
                return c.json({ error: "Cannot delete default roles" }, 400);
            }

            // Check if any members are using this role
            const membersWithRole = await databases.listDocuments<ProjectMember>(
                DATABASE_ID,
                PROJECT_MEMBERS_ID,
                [Query.equal("roleId", roleId)]
            );

            if (membersWithRole.total > 0) {
                return c.json({
                    error: `Cannot delete role. ${membersWithRole.total} member(s) are using this role.`,
                }, 400);
            }

            await databases.deleteDocument(DATABASE_ID, PROJECT_ROLES_ID, roleId);

            return c.json({ data: { $id: roleId } });
        }
    );

export default app;
