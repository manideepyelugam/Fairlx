import { Databases, Query } from "node-appwrite";
import { getMember } from "@/features/members/utils";

import { PERMISSIONS, ROLE_PERMISSIONS, Role } from "./permissions";
import { DATABASE_ID, CUSTOM_ROLES_ID } from "@/config";

/**
 * Checks if a user has a specific permission within a workspace.
 * 
 * Logic:
 * 1. Fetch Member record.
 * 2. If Owner, always allow.
 * 3. Check 'workspace_roles' collection for custom permissions for this role.
 * 4. If not found in DB, use default ROLE_PERMISSIONS registry.
 * 5. Return true if permission exists, false otherwise.
 */
/**
 * Retrieves the list of permissions for a user in a workspace.
 */
export async function getPermissions(
    databases: Databases,
    workspaceId: string,
    userId: string
): Promise<string[]> {
    try {
        const member = await getMember({ databases, workspaceId, userId });

        if (!member) {
            return [];
        }

        console.log(`[RBAC] Member found: ${member.$id}, Role: ${member.role}`);

        // 1. Owner always has access (return all unique permissions)
        if (member.role === "OWNER") {
            return Object.values(PERMISSIONS);
        }

        // 2. Check for Custom Roles in Database
        try {
            console.log(`[RBAC] Checking custom role: ${member.role} in workspace: ${workspaceId}`);
            const roleDocs = await databases.listDocuments(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                [
                    Query.equal("workspaceId", workspaceId),
                    Query.equal("name", member.role),
                ]
            );
            console.log(`[RBAC] Found ${roleDocs.total} custom role docs`);

            if (roleDocs.total > 0) {
                const customRole = roleDocs.documents[0];
                return customRole.permissions || [];
            }
        } catch {
            // console.warn("Custom role check failed, falling back to defaults:", dbError);
        }

        // 3. Fallback to Default Registry
        return ROLE_PERMISSIONS[member.role as Role] || [];
    } catch (error) {
        console.error("Get permissions failed:", error);
        return [];
    }
}

/**
 * Checks if a user has a specific permission within a workspace.
 */
export async function can(
    databases: Databases,
    workspaceId: string,
    userId: string,
    permission: string
): Promise<boolean> {
    const permissions = await getPermissions(databases, workspaceId, userId);
    return permissions.includes(permission);
}
