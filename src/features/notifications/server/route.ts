import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { DATABASE_ID, NOTIFICATIONS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { getMember } from "@/features/members/utils";

import {
  createNotificationSchema,
  markAllNotificationsReadSchema,
  getNotificationsSchema,
} from "../schemas";
import { Notification, PopulatedNotification } from "../types";

const app = new Hono()
  // Get notifications for current user
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", getNotificationsSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { users } = await createAdminClient();

      const { workspaceId, limit, unreadOnly } = c.req.valid("query");

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Build query
      const query = [
        Query.equal("workspaceId", workspaceId),
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ];

      if (unreadOnly) {
        query.push(Query.equal("read", false));
      }

      const notifications = await databases.listDocuments<Notification>(
        DATABASE_ID,
        NOTIFICATIONS_ID,
        query
      );

      // Get unique triggered by user IDs
      const triggeredByIds = [
        ...new Set(notifications.documents.map((n) => n.triggeredBy)),
      ];

      // Fetch triggered by users
      const triggeredByUsers = await Promise.all(
        triggeredByIds.map(async (userId) => {
          try {
            const user = await users.get(userId);
            const prefs = user.prefs as
              | { profileImageUrl?: string | null }
              | undefined;
            return {
              $id: user.$id,
              name: user.name || user.email,
              email: user.email,
              profileImageUrl: prefs?.profileImageUrl ?? null,
            };
          } catch {
            return null;
          }
        })
      );

      const validTriggeredByUsers = triggeredByUsers.filter(
        (u): u is NonNullable<typeof u> => u !== null
      );

      // Populate notifications
      const populatedNotifications: PopulatedNotification[] =
        notifications.documents.map((notification) => {
          const triggeredByUser = validTriggeredByUsers.find(
            (u) => u.$id === notification.triggeredBy
          );

          // Parse metadata if exists
          let metadata = undefined;
          if (notification.metadata) {
            try {
              metadata = JSON.parse(notification.metadata);
            } catch {
              // Invalid JSON, ignore
            }
          }

          return {
            ...notification,
            triggeredByUser,
            task: metadata?.taskName
              ? { $id: notification.taskId, name: metadata.taskName }
              : undefined,
          };
        });

      return c.json({
        data: {
          documents: populatedNotifications,
          total: notifications.total,
        },
      });
    }
  )

  // Get unread count
  .get("/unread-count", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { workspaceId } = c.req.query();

    if (!workspaceId) {
      return c.json({ error: "Workspace ID is required" }, 400);
    }

    // Verify user is a member of the workspace
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const unreadNotifications = await databases.listDocuments<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      [
        Query.equal("workspaceId", workspaceId),
        Query.equal("userId", user.$id),
        Query.equal("read", false),
        Query.limit(1),
      ]
    );

    return c.json({ data: { count: unreadNotifications.total } });
  })

  // Mark notification as read
  .patch(
    "/:notificationId/read",
    sessionMiddleware,
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { notificationId } = c.req.param();

      // Get notification
      const notification = await databases.getDocument<Notification>(
        DATABASE_ID,
        NOTIFICATIONS_ID,
        notificationId
      );

      // Verify user owns this notification
      if (notification.userId !== user.$id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Update notification
      const updatedNotification = await databases.updateDocument(
        DATABASE_ID,
        NOTIFICATIONS_ID,
        notificationId,
        { read: true }
      );

      return c.json({ data: updatedNotification });
    }
  )

  // Mark all notifications as read
  .patch(
    "/read-all",
    sessionMiddleware,
    zValidator("json", markAllNotificationsReadSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("json");

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get all unread notifications
      const unreadNotifications = await databases.listDocuments<Notification>(
        DATABASE_ID,
        NOTIFICATIONS_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("userId", user.$id),
          Query.equal("read", false),
          Query.limit(100),
        ]
      );

      // Mark all as read
      await Promise.all(
        unreadNotifications.documents.map((notification) =>
          databases.updateDocument(
            DATABASE_ID,
            NOTIFICATIONS_ID,
            notification.$id,
            { read: true }
          )
        )
      );

      return c.json({ data: { success: true, count: unreadNotifications.total } });
    }
  )

  // Delete notification
  .delete("/:notificationId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { notificationId } = c.req.param();

    // Get notification
    const notification = await databases.getDocument<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      notificationId
    );

    // Verify user owns this notification
    if (notification.userId !== user.$id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Delete notification
    await databases.deleteDocument(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      notificationId
    );

    return c.json({ data: { $id: notificationId } });
  })

  // Create notification (internal API for Appwrite Function)
  .post(
    "/",
    zValidator("json", createNotificationSchema),
    async (c) => {
      const databases = c.get("databases");
      const { userId, type, title, message, taskId, workspaceId, triggeredBy, metadata } =
        c.req.valid("json");

      const notification = await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_ID,
        ID.unique(),
        {
          userId,
          type,
          title,
          message,
          taskId,
          workspaceId,
          triggeredBy,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          read: false,
        }
      );

      return c.json({ data: notification });
    }
  );

export default app;
