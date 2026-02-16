import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sessionMiddleware } from "@/lib/session-middleware";
import { WebhookRepository } from "./repository";
import { Webhook } from "./types";
import { createWebhookSchema, updateWebhookSchema } from "./validations";

const app = new Hono()
    // Create webhook
    .post(
        "/",
        sessionMiddleware,
        zValidator("json", createWebhookSchema.extend({ projectId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { projectId, ...data } = c.req.valid("json");

            // Permission check: Only OWNER/ADMIN can manage webhooks
            const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
            const access = await resolveUserProjectAccess(databases, user.$id, projectId);

            if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.EDIT_SETTINGS)) {
                return c.json({ error: "Forbidden: No permission to manage webhooks" }, 403);
            }

            const repo = new WebhookRepository(databases);
            const webhook = await repo.createWebhook({
                projectId,
                createdByUserId: user.$id,
                ...data,
            });

            return c.json({ data: webhook });
        }
    )

    // List webhooks for a project
    .get(
        "/",
        sessionMiddleware,
        zValidator("query", z.object({ projectId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { projectId } = c.req.valid("query");

            const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
            const access = await resolveUserProjectAccess(databases, user.$id, projectId);

            if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.EDIT_SETTINGS)) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const repo = new WebhookRepository(databases);
            const webhooks = await repo.getWebhooksByProject(projectId);

            return c.json({ data: webhooks });
        }
    )

    // Update webhook
    .patch(
        "/:webhookId",
        sessionMiddleware,
        zValidator("json", updateWebhookSchema.partial().extend({ projectId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { webhookId } = c.req.param();
            const { projectId, ...data } = c.req.valid("json");

            const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
            const access = await resolveUserProjectAccess(databases, user.$id, projectId);

            if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.EDIT_SETTINGS)) {
                return c.json({ error: "Forbidden" }, 403);
            }

            const repo = new WebhookRepository(databases);
            const webhook = await repo.updateWebhook(webhookId, data);

            return c.json({ data: webhook });
        }
    )

    // Delete webhook
    .delete(
        "/:webhookId",
        sessionMiddleware,
        zValidator("query", z.object({ projectId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { webhookId } = c.req.param();
            const { projectId } = c.req.valid("query");

            const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
            const access = await resolveUserProjectAccess(databases, user.$id, projectId);

            if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.EDIT_SETTINGS)) {
                return c.json({ error: "Forbidden" }, 403);
            }

            const repo = new WebhookRepository(databases);
            await repo.deleteWebhook(webhookId);

            return c.json({ data: { $id: webhookId } });
        }
    )

    // Get recent deliveries
    .get(
        "/:webhookId/deliveries",
        sessionMiddleware,
        zValidator("query", z.object({ projectId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { webhookId } = c.req.param();
            const { projectId } = c.req.valid("query");

            const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
            const access = await resolveUserProjectAccess(databases, user.$id, projectId);

            if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.EDIT_SETTINGS)) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const repo = new WebhookRepository(databases);
            const deliveries = await repo.getRecentDeliveries(webhookId);

            return c.json({ data: deliveries });
        }
    )

    // Test webhook
    .post(
        "/:webhookId/test",
        sessionMiddleware,
        zValidator("json", z.object({ projectId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { webhookId } = c.req.param();
            const { projectId } = c.req.valid("json");

            const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
            const access = await resolveUserProjectAccess(databases, user.$id, projectId);

            if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.EDIT_SETTINGS)) {
                return c.json({ error: "Forbidden" }, 403);
            }

            const { DATABASE_ID, PROJECT_WEBHOOKS_ID } = await import("@/config");
            const webhook = await databases.getDocument(DATABASE_ID, PROJECT_WEBHOOKS_ID, webhookId) as unknown as Webhook;

            const { webhookDispatcher } = await import("./webhookDispatcher");
            const success = await webhookDispatcher.test(webhook);

            return c.json({ data: { success } });
        }
    );

export default app;
