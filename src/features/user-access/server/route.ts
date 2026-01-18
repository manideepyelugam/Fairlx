import { Hono } from "hono";
import { sessionMiddleware } from "@/lib/session-middleware";
import { resolveUserAccess, resolvePersonalUserAccess } from "@/lib/permissions/resolveUserAccess";

/**
 * User Access API
 * 
 * Returns the user's allowed route keys and permissions for navigation.
 * This is the client-accessible endpoint for the permission system.
 * 
 * NOTE: This is for client-side UI rendering only.
 * Server-side route guards are the authoritative check.
 */

const app = new Hono()
    .get("/", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");

        // Get query params
        const organizationId = c.req.query("organizationId");
        const workspaceId = c.req.query("workspaceId");

        // Check if this is a personal account (no org)
        const prefs = user.prefs || {};
        const isPersonalAccount = prefs.accountType !== "ORG";

        if (isPersonalAccount) {
            // Personal accounts get full workspace access
            const access = resolvePersonalUserAccess(workspaceId);
            return c.json({
                allowedRouteKeys: access.allowedRouteKeys,
                isOwner: false,
                role: null,
                departmentIds: [],
                hasDepartmentAccess: false,
            });
        }

        // For ORG accounts, resolve access from database
        const access = await resolveUserAccess(
            databases,
            user.$id,
            organizationId,
            workspaceId
        );

        return c.json({
            allowedRouteKeys: access.allowedRouteKeys,
            permissions: access.permissions,  // Added for client hooks
            isOwner: access.isOwner,
            role: access.role,
            orgMemberId: access.orgMemberId,  // Added for client hooks
            departmentIds: access.departmentIds,
            hasDepartmentAccess: access.hasDepartmentAccess,
        });
    });

export default app;

