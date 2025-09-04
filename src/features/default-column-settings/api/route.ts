import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";

import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, DEFAULT_COLUMN_SETTINGS_ID } from "@/config";

import { defaultColumnSettingsSchema, updateDefaultColumnSettingsSchema } from "../schemas";
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
          }
        );
        createdSettings.push(created);
      }

      return c.json({ data: createdSettings });
    }
  );

export default app;
