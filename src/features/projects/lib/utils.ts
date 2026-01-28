import { ID, Databases, Query } from "node-appwrite";
import { DATABASE_ID, PROJECT_ROLES_ID } from "@/config";
import { ProjectMemberRole } from "@/features/project-teams/types";
import { ROLE_PERMISSIONS } from "@/lib/permissions/resolveUserProjectAccess";


/**
 * Seed default project roles
 * 
 * Creates the standard roles (OWNER, ADMIN, MEMBER, VIEW) for a new project.
 * Uses the default permissions defined in ROLE_PERMISSIONS.
 */
export async function seedProjectRoles(
    databases: Databases,
    projectId: string,
    workspaceId: string,
    userId: string
): Promise<void> {
    const defaults = [
        {
            role: ProjectMemberRole.PROJECT_OWNER,
            name: "Owner",
            color: "#ef4444", // Red
            description: "Full access to project settings, members, and resources.",
        },
        {
            role: ProjectMemberRole.PROJECT_ADMIN,
            name: "Admin",
            color: "#f97316", // Orange
            description: "Can manage tasks, sprints, and docs, but cannot delete the project.",
        },
        {
            role: ProjectMemberRole.MEMBER,
            name: "Member",
            color: "#3b82f6", // Blue
            description: "Can create and edit tasks, but has limited administrative access.",
        },
        {
            role: ProjectMemberRole.VIEWER,
            name: "Viewer",
            color: "#6b7280", // Gray
            description: "Can view project resources but cannot make changes.",
        },
    ];

    try {
        const promises = defaults.map(async (def) => {
            // Check if role already exists (idempotency)
            const existing = await databases.listDocuments(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                [
                    Query.equal("projectId", projectId),
                    Query.equal("name", def.name),
                ]
            );

            if (existing.total > 0) {
                return;
            }

            const permissions = ROLE_PERMISSIONS[def.role] || [];

            await databases.createDocument(
                DATABASE_ID,
                PROJECT_ROLES_ID,
                ID.unique(),
                {
                    workspaceId,
                    projectId,
                    name: def.name,
                    description: def.description,
                    permissions,
                    color: def.color,
                    isDefault: true,
                    createdBy: userId,
                }
            );
        });

        await Promise.all(promises);
    } catch {
        // Don't throw, failing to seed roles shouldn't crash the request, 
        // but it will result in an empty dropdown (as observed).
    }
}
