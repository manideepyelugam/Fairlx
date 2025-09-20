import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, CUSTOM_COLUMNS_ID } from "@/config";

import { createCustomColumnSchema, updateCustomColumnSchema } from "../schemas";

const app = new Hono()
  .get(
    "/",
    zValidator("query", createCustomColumnSchema.pick({ workspaceId: true, projectId: true })),
    async (c) => {
      const { workspaceId, projectId } = c.req.valid("query");

      const { databases } = await createSessionClient();

      const customColumns = await databases.listDocuments(
        DATABASE_ID,
        CUSTOM_COLUMNS_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("projectId", projectId),
          Query.orderAsc("position"),
        ]
      );

      return c.json({ data: customColumns });
    }
  )
  .post(
    "/",
    zValidator("json", createCustomColumnSchema),
    async (c) => {
      const { name, workspaceId, projectId, icon, color, position } = c.req.valid("json");

      const { databases } = await createSessionClient();

      // If no position provided, get the highest position + 1000
      let finalPosition = position;
      if (finalPosition === undefined) {
        const existingColumns = await databases.listDocuments(
          DATABASE_ID,
          CUSTOM_COLUMNS_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.equal("projectId", projectId),
            Query.orderDesc("position"),
            Query.limit(1),
          ]
        );

        finalPosition = existingColumns.documents.length > 0 
          ? existingColumns.documents[0].position + 1000 
          : 1000;
      }

      const customColumn = await databases.createDocument(
        DATABASE_ID,
        CUSTOM_COLUMNS_ID,
        ID.unique(),
        {
          name,
          workspaceId,
          projectId,
          icon,
          color,
          position: finalPosition,
        }
      );

      return c.json({ data: customColumn });
    }
  )
  .patch(
    "/:customColumnId",
    zValidator("json", updateCustomColumnSchema),
    async (c) => {
      const customColumnId = c.req.param("customColumnId");
      const updates = c.req.valid("json");

      const { databases } = await createSessionClient();

      const customColumn = await databases.updateDocument(
        DATABASE_ID,
        CUSTOM_COLUMNS_ID,
        customColumnId,
        updates
      );

      return c.json({ data: customColumn });
    }
  )
  .delete("/:customColumnId", async (c) => {
    const customColumnId = c.req.param("customColumnId");

    const { databases } = await createSessionClient();

    await databases.deleteDocument(
      DATABASE_ID,
      CUSTOM_COLUMNS_ID,
      customColumnId
    );

    return c.json({ data: { $id: customColumnId } });
  });

export default app;
