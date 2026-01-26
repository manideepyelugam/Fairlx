import "server-only";

import { Context, Next } from "hono";
import {
    resolveUserProjectAccess,
    hasProjectPermission,
    ProjectPermissionKey,
} from "@/lib/permissions/resolveUserProjectAccess";

/**
 * Project Membership Middleware
 * 
 * ENFORCEMENT MIDDLEWARE for project-scoped routes.
 * 
 * Usage:
 * ```typescript
 * .get(
 *     "/:projectId/tasks",
 *     sessionMiddleware,
 *     projectMembershipMiddleware("VIEW_TASKS"),
 *     async (c) => { ... }
 * )
 * ```
 * 
 * After this middleware:
 * - `c.get("projectAccess")` contains the resolved access result
 */
export function projectMembershipMiddleware(
    requiredPermission?: ProjectPermissionKey | string
) {
    return async (c: Context, next: Next) => {
        const databases = c.get("databases");
        const user = c.get("user");

        // Get projectId from params or query (not body to avoid consuming stream)
        const projectId = c.req.param("projectId") || c.req.query("projectId");

        if (!projectId) {
            return c.json({ error: "Project ID is required in params or query" }, 400);
        }

        if (!user?.$id) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        // Resolve project access
        const access = await resolveUserProjectAccess(databases, user.$id, projectId);

        if (!access.hasAccess) {
            return c.json({ error: "Forbidden: Not a project member" }, 403);
        }

        // Check specific permission if required
        if (requiredPermission && !hasProjectPermission(access, requiredPermission)) {
            return c.json(
                { error: `Forbidden: Missing permission ${requiredPermission}` },
                403
            );
        }

        // Store access in context for route handlers
        c.set("projectAccess", access);

        await next();
    };
}

/**
 * Assert project membership in a route handler
 * 
 * Use this when you need to check membership inside a handler
 * rather than using middleware.
 */
export async function assertProjectMembership(
    c: Context,
    projectId: string,
    requiredPermission?: ProjectPermissionKey | string
) {
    const databases = c.get("databases");
    const user = c.get("user");

    if (!user?.$id) {
        throw new Error("Unauthorized");
    }

    const access = await resolveUserProjectAccess(databases, user.$id, projectId);

    if (!access.hasAccess) {
        throw new Error("Forbidden: Not a project member");
    }

    if (requiredPermission && !hasProjectPermission(access, requiredPermission)) {
        throw new Error(`Forbidden: Missing permission ${requiredPermission}`);
    }

    return access;
}
