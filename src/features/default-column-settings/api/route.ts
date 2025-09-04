import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, DEFAULT_COLUMN_SETTINGS_ID, CUSTOM_COLUMNS_ID } from "@/config";

import { defaultColumnSettingsSchema, updateDefaultColumnSettingsSchema, updateColumnOrderSchema } from "../schemas";
import { TaskStatus } from "@/features/tasks/types";

const app = new Hono()
  .get(
    "/",
    zValidator("query", defaultColumnSettingsSchema.pick({ workspaceId: true, projectId: true })),
    async (c) => {
      const { workspaceId, projectId } = c.req.valid("query");

      const { databases } = await createSessionClient();

      const settings = await databases.listDocuments(
        DATABASE_ID,
        DEFAULT_COLUMN_SETTINGS_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("projectId", projectId),
          Query.orderAsc("position"),
        ]
      );

      return c.json({ data: settings });
    }
  )
  .post(
    "/",
    zValidator("json", updateDefaultColumnSettingsSchema),
    async (c) => {
      const { workspaceId, projectId, settings } = c.req.valid("json");

      const { databases } = await createSessionClient();

      // First, delete existing settings for this workspace and project
      const existingSettings = await databases.listDocuments(
        DATABASE_ID,
        DEFAULT_COLUMN_SETTINGS_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.equal("projectId", projectId),
        ]
      );

      // Delete existing settings
      for (const setting of existingSettings.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          DEFAULT_COLUMN_SETTINGS_ID,
          setting.$id
        );
      }

      // Create new settings
      const createdSettings = [];
      for (const setting of settings) {
        const created = await databases.createDocument(
          DATABASE_ID,
          DEFAULT_COLUMN_SETTINGS_ID,
          ID.unique(),
          {
            workspaceId,
            projectId,
            columnId: setting.columnId,
            isEnabled: setting.isEnabled,
            position: setting.position || 1000,
          }
        );
        createdSettings.push(created);
      }

      return c.json({ data: createdSettings });
    }
  )
  .patch(
    "/order",
    zValidator("json", updateColumnOrderSchema),
    async (c) => {
      const { workspaceId, projectId, columns } = c.req.valid("json");

      const { databases } = await createSessionClient();

      const updates = [];

      for (const column of columns) {
        try {
          if (column.type === "default") {
            // Update default column position in default_column_settings
            const existingSettings = await databases.listDocuments(
              DATABASE_ID,
              DEFAULT_COLUMN_SETTINGS_ID,
              [
                Query.equal("workspaceId", workspaceId),
                Query.equal("projectId", projectId),
                Query.equal("columnId", column.id),
              ]
            );

            if (existingSettings.documents.length > 0) {
              const updated = await databases.updateDocument(
                DATABASE_ID,
                DEFAULT_COLUMN_SETTINGS_ID,
                existingSettings.documents[0].$id,
                { position: column.position }
              );
              updates.push(updated);
            }
          } else if (column.type === "custom") {
            // Update custom column position
            const updated = await databases.updateDocument(
              DATABASE_ID,
              CUSTOM_COLUMNS_ID,
              column.id,
              { position: column.position }
            );
            updates.push(updated);
          }
        } catch (error) {
          console.error(`Failed to update column ${column.id}:`, error);
        }
      }

      return c.json({ data: updates });
    }
  );

export default app;
