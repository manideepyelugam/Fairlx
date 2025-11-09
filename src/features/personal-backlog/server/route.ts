import { ID, Query } from "node-appwrite";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { DATABASE_ID, PERSONAL_BACKLOG_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";

import { createBacklogItemSchema, updateBacklogItemSchema, bulkUpdateBacklogItemsSchema } from "../schemas";
import { BacklogItem } from "../types";

const app = new Hono()
  // Get all backlog items for current user in a workspace
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        status: z.string().optional(),
        priority: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { workspaceId, status, priority, type, search } = c.req.valid("query");

      const queries = [
        Query.equal("userId", user.$id),
        Query.equal("workspaceId", workspaceId),
        Query.orderAsc("position"),
        Query.limit(100),
      ];

      if (status) {
        queries.push(Query.equal("status", status));
      }

      if (priority) {
        queries.push(Query.equal("priority", priority));
      }

      if (type) {
        queries.push(Query.equal("type", type));
      }

      if (search) {
        queries.push(Query.search("title", search));
      }

      const items = await databases.listDocuments<BacklogItem>(
        DATABASE_ID,
        PERSONAL_BACKLOG_ID,
        queries
      );

      return c.json({ data: items });
    }
  )
  // Create a new backlog item
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createBacklogItemSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const data = c.req.valid("json");

      // Get admin client for creating with permissions
      const { databases: adminDatabases } = await createAdminClient();

      // Get the highest position
      const items = await databases.listDocuments<BacklogItem>(
        DATABASE_ID,
        PERSONAL_BACKLOG_ID,
        [
          Query.equal("userId", user.$id),
          Query.equal("workspaceId", data.workspaceId),
          Query.orderDesc("position"),
          Query.limit(1),
        ]
      );

      const highestPosition = items.documents[0]?.position ?? 0;

      const item = await adminDatabases.createDocument<BacklogItem>(
        DATABASE_ID,
        PERSONAL_BACKLOG_ID,
        ID.unique(),
        {
          ...data,
          userId: user.$id,
          position: highestPosition + 1000,
          flagged: data.flagged ?? false,
          labels: data.labels ?? [],
        },
        [
          `read("user:${user.$id}")`,
          `update("user:${user.$id}")`,
          `delete("user:${user.$id}")`,
        ]
      );

      return c.json({ data: item });
    }
  )
  // Update a backlog item
  .patch(
    "/:itemId",
    sessionMiddleware,
    zValidator("json", updateBacklogItemSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { itemId } = c.req.param();
      const data = c.req.valid("json");

      const existingItem = await databases.getDocument<BacklogItem>(
        DATABASE_ID,
        PERSONAL_BACKLOG_ID,
        itemId
      );

      if (existingItem.userId !== user.$id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updateData = { ...data };
      (updateData as Record<string, unknown>).lastModifiedBy = user.$id;

      const item = await databases.updateDocument<BacklogItem>(
        DATABASE_ID,
        PERSONAL_BACKLOG_ID,
        itemId,
        updateData
      );

      return c.json({ data: item });
    }
  )
  // Delete a backlog item
  .delete("/:itemId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { itemId } = c.req.param();

    const existingItem = await databases.getDocument<BacklogItem>(
      DATABASE_ID,
      PERSONAL_BACKLOG_ID,
      itemId
    );

    if (existingItem.userId !== user.$id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, PERSONAL_BACKLOG_ID, itemId);

    return c.json({ data: { $id: itemId } });
  })
  // Bulk update backlog items (for drag and drop)
  .post(
    "/bulk-update",
    sessionMiddleware,
    zValidator("json", bulkUpdateBacklogItemsSchema),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { items } = c.req.valid("json");

      const { databases: adminDatabases } = await createAdminClient();

      // Verify all items belong to the user
      for (const item of items) {
        const existingItem = await databases.getDocument<BacklogItem>(
          DATABASE_ID,
          PERSONAL_BACKLOG_ID,
          item.$id
        );

        if (existingItem.userId !== user.$id) {
          return c.json({ error: "Unauthorized" }, 401);
        }
      }

      // Update all items
      const updatedItems = await Promise.all(
        items.map((item) =>
          adminDatabases.updateDocument<BacklogItem>(
            DATABASE_ID,
            PERSONAL_BACKLOG_ID,
            item.$id,
            {
              status: item.status,
              position: item.position,
            }
          )
        )
      );

      return c.json({ data: updatedItems });
    }
  );

export default app;
