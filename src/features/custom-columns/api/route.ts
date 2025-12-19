import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, CUSTOM_COLUMNS_ID } from "@/config";

import { createCustomColumnSchema, updateCustomColumnSchema } from "../schemas";

// Query schema for GET - supports both projectId and workflowId
const getCustomColumnsQuerySchema = z.object({
  workspaceId: z.string(),
  projectId: z.string().optional(),
  workflowId: z.string().optional(),
});

const app = new Hono()
  .get(
    "/",
    zValidator("query", getCustomColumnsQuerySchema),
    async (c) => {
      const { workspaceId, projectId, workflowId } = c.req.valid("query");

      const { databases } = await createSessionClient();

      const queries = [
        Query.equal("workspaceId", workspaceId),
        Query.orderAsc("position"),
      ];

      // Filter by projectId or workflowId
      if (projectId) {
        queries.push(Query.equal("projectId", projectId));
      }
      if (workflowId) {
        queries.push(Query.equal("workflowId", workflowId));
      }

      const customColumns = await databases.listDocuments(
        DATABASE_ID,
        CUSTOM_COLUMNS_ID,
        queries
      );

      return c.json({ data: customColumns });
    }
  )
  .post(
    "/",
    zValidator("json", createCustomColumnSchema),
    async (c) => {
      const { name, workspaceId, projectId, workflowId, icon, color, position } = c.req.valid("json");

      const { databases } = await createSessionClient();

      // Build query based on projectId or workflowId
      const filterQueries = [Query.equal("workspaceId", workspaceId)];
      if (projectId) {
        filterQueries.push(Query.equal("projectId", projectId));
      }
      if (workflowId) {
        filterQueries.push(Query.equal("workflowId", workflowId));
      }

      // If no position provided, get the highest position + 1000
      let finalPosition = position;
      if (finalPosition === undefined) {
        const existingColumns = await databases.listDocuments(
          DATABASE_ID,
          CUSTOM_COLUMNS_ID,
          [
            ...filterQueries,
            Query.orderDesc("position"),
            Query.limit(1),
          ]
        );

        finalPosition = existingColumns.documents.length > 0 
          ? existingColumns.documents[0].position + 1000 
          : 1000;
      }

      const documentData: Record<string, unknown> = {
        name,
        workspaceId,
        icon,
        color,
        position: finalPosition,
      };

      // Only set projectId or workflowId if provided
      if (projectId) {
        documentData.projectId = projectId;
      }
      if (workflowId) {
        documentData.workflowId = workflowId;
      }

      const customColumn = await databases.createDocument(
        DATABASE_ID,
        CUSTOM_COLUMNS_ID,
        ID.unique(),
        documentData
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
