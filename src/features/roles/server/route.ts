import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, CUSTOM_ROLES_ID } from "@/config";
import { MemberRole } from "@/features/members/types";
import { getMember } from "@/features/members/utils";


// Zod schema for role creation/update
// We call it "roleName" in DB, but let's expose as "name" in API for cleaner usage?
// In DB schema it is `roleName`, `workspaceId`, `permissions` (array).
const roleSchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    permissions: z.array(z.string()),
});

const app = new Hono()
    .get(
        "/",
        sessionMiddleware,
        zValidator("query", z.object({ workspaceId: z.string() })),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { workspaceId } = c.req.valid("query");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            // Fetch custom roles for this workspace
            const roles = await databases.listDocuments(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                [Query.equal("workspaceId", workspaceId)]
            );

            return c.json({ data: roles });
        }
    )
    .post(
        "/",
        sessionMiddleware,
        zValidator("json", roleSchema.extend({ workspaceId: z.string() })),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { name, permissions, workspaceId } = c.req.valid("json");

            // Verify permission to manage roles (using BILLING_MANAGE or new ROLE_MANAGE?)
            // For now, let's use owner/admin check via MemberRole for simplicity, 
            // or check "workspace:update" which Admins have.
            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                // Alternatively use can() check if we add a permission for role management
                // if (!(await can(databases, workspaceId, user.$id, PERMISSIONS.WORKSPACE_UPDATE))) ...
                return c.json({ error: "Unauthorized" }, 401);
            }

            // Create Custom Role
            const role = await databases.createDocument(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                ID.unique(),
                {
                    workspaceId,
                    name,
                    roleName: name,
                    permissions,
                    createdBy: user.$id,
                    lastModifiedBy: user.$id,
                }
            );

            return c.json({ data: role });
        }
    )
    .patch(
        "/:roleId",
        sessionMiddleware,
        zValidator("json", roleSchema),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { roleId } = c.req.param();
            const { name, permissions } = c.req.valid("json");

            // We need workspaceId to check permission. Fetch role first.
            const existingRole = await databases.getDocument(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                roleId
            );

            const member = await getMember({
                databases,
                workspaceId: existingRole.workspaceId,
                userId: user.$id,
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const role = await databases.updateDocument(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                roleId,
                {
                    name,
                    roleName: name,
                    permissions,
                    lastModifiedBy: user.$id,
                }
            );

            return c.json({ data: role });
        }
    )
    .delete(
        "/:roleId",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { roleId } = c.req.param();

            const existingRole = await databases.getDocument(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                roleId
            );

            const member = await getMember({
                databases,
                workspaceId: existingRole.workspaceId,
                userId: user.$id,
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            // Check if role is in use?
            // For MVP, we allow deletion, but users with this role might default to "Viewer" (no permissions found)
            // Ideally we should warn or block.

            await databases.deleteDocument(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                roleId
            );

            return c.json({ data: { $id: roleId } });
        }
    );

export default app;
