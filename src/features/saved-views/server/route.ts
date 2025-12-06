import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { getMember } from "@/features/members/utils";

import {
  DATABASE_ID,
  SAVED_VIEWS_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import {
  createSavedViewSchema,
  updateSavedViewSchema,
} from "../schemas";
import {
  SavedView,
  SavedViewType,
  SavedViewScope,
  VIEW_PRESETS,
} from "../types";

const app = new Hono()
  // Create a saved view
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createSavedViewSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const {
        workspaceId,
        projectId,
        spaceId,
        name,
        description,
        type,
        scope,
        filters,
        columns,
        sort,
        kanbanConfig,
        calendarConfig,
        timelineConfig,
        quickFilters,
        isDefault,
        isPinned,
        icon,
        color,
      } = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // If setting as default, unset other defaults for this user
      if (isDefault) {
        const existingDefaults = await databases.listDocuments<SavedView>(
          DATABASE_ID,
          SAVED_VIEWS_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", user.$id),
            Query.equal("type", type),
            Query.equal("isDefault", true),
            ...(projectId ? [Query.equal("projectId", projectId)] : []),
          ]
        );

        await Promise.all(
          existingDefaults.documents.map((view) =>
            databases.updateDocument(DATABASE_ID, SAVED_VIEWS_ID, view.$id, {
              isDefault: false,
            })
          )
        );
      }

      const savedView = await databases.createDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        ID.unique(),
        {
          workspaceId,
          projectId: projectId || null,
          spaceId: spaceId || null,
          name,
          description: description || null,
          type,
          scope: scope || SavedViewScope.PERSONAL,
          filters: filters ? JSON.stringify(filters) : null,
          columns: columns ? JSON.stringify(columns) : null,
          sort: sort ? JSON.stringify(sort) : null,
          kanbanConfig: kanbanConfig ? JSON.stringify(kanbanConfig) : null,
          calendarConfig: calendarConfig ? JSON.stringify(calendarConfig) : null,
          timelineConfig: timelineConfig ? JSON.stringify(timelineConfig) : null,
          quickFilters: quickFilters ? JSON.stringify(quickFilters) : null,
          isDefault: isDefault ?? false,
          isPinned: isPinned ?? false,
          icon: icon || null,
          color: color || null,
          userId: user.$id,
          position: 0,
        }
      );

      return c.json({ data: savedView });
    }
  )

  // List saved views
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        spaceId: z.string().optional(),
        viewType: z.string().optional(),
        includeShared: z.string().optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, projectId, spaceId, viewType, includeShared } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Build query for user's views and optionally shared views
      const queries: string[] = [
        Query.equal("workspaceId", workspaceId),
        Query.orderAsc("position"),
      ];

      if (projectId) {
        queries.push(
          Query.or([
            Query.isNull("projectId"),
            Query.equal("projectId", projectId),
          ])
        );
      }

      if (spaceId) {
        queries.push(
          Query.or([
            Query.isNull("spaceId"),
            Query.equal("spaceId", spaceId),
          ])
        );
      }

      if (viewType) {
        queries.push(Query.equal("type", viewType as SavedViewType));
      }

      // Filter by ownership and scope
      if (includeShared === "true") {
        queries.push(
          Query.or([
            Query.equal("userId", user.$id),
            Query.notEqual("scope", SavedViewScope.PERSONAL),
          ])
        );
      } else {
        queries.push(Query.equal("userId", user.$id));
      }

      const savedViews = await databases.listDocuments<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        queries
      );

      return c.json({ data: savedViews });
    }
  )

  // Get a single saved view
  .get(
    "/:viewId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { viewId } = c.req.param();

      const savedView = await databases.getDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        viewId
      );

      const member = await getMember({
        databases,
        workspaceId: savedView.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user can access this view
      if (savedView.userId !== user.$id && savedView.scope === SavedViewScope.PERSONAL) {
        return c.json({ error: "Access denied" }, 403);
      }

      return c.json({ data: savedView });
    }
  )

  // Update a saved view
  .patch(
    "/:viewId",
    sessionMiddleware,
    zValidator("json", updateSavedViewSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { viewId } = c.req.param();

      const updates = c.req.valid("json");

      const savedView = await databases.getDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        viewId
      );

      const member = await getMember({
        databases,
        workspaceId: savedView.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Only owner can update
      if (savedView.userId !== user.$id) {
        return c.json({ error: "Only the owner can update this view" }, 403);
      }

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        const existingDefaults = await databases.listDocuments<SavedView>(
          DATABASE_ID,
          SAVED_VIEWS_ID,
          [
            Query.equal("workspaceId", savedView.workspaceId),
            Query.equal("userId", user.$id),
            Query.equal("type", savedView.type),
            Query.equal("isDefault", true),
            Query.notEqual("$id", viewId),
          ]
        );

        await Promise.all(
          existingDefaults.documents.map((view) =>
            databases.updateDocument(DATABASE_ID, SAVED_VIEWS_ID, view.$id, {
              isDefault: false,
            })
          )
        );
      }

      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.scope !== undefined) updateData.scope = updates.scope;
      if (updates.filters !== undefined) updateData.filters = updates.filters ? JSON.stringify(updates.filters) : null;
      if (updates.columns !== undefined) updateData.columns = updates.columns ? JSON.stringify(updates.columns) : null;
      if (updates.sort !== undefined) updateData.sort = updates.sort ? JSON.stringify(updates.sort) : null;
      if (updates.kanbanConfig !== undefined) updateData.kanbanConfig = updates.kanbanConfig ? JSON.stringify(updates.kanbanConfig) : null;
      if (updates.calendarConfig !== undefined) updateData.calendarConfig = updates.calendarConfig ? JSON.stringify(updates.calendarConfig) : null;
      if (updates.timelineConfig !== undefined) updateData.timelineConfig = updates.timelineConfig ? JSON.stringify(updates.timelineConfig) : null;
      if (updates.quickFilters !== undefined) updateData.quickFilters = updates.quickFilters ? JSON.stringify(updates.quickFilters) : null;
      if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;
      if (updates.isPinned !== undefined) updateData.isPinned = updates.isPinned;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.position !== undefined) updateData.position = updates.position;

      const updatedView = await databases.updateDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        viewId,
        updateData
      );

      return c.json({ data: updatedView });
    }
  )

  // Delete a saved view
  .delete(
    "/:viewId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { viewId } = c.req.param();

      const savedView = await databases.getDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        viewId
      );

      const member = await getMember({
        databases,
        workspaceId: savedView.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Only owner can delete
      if (savedView.userId !== user.$id) {
        return c.json({ error: "Only the owner can delete this view" }, 403);
      }

      await databases.deleteDocument(DATABASE_ID, SAVED_VIEWS_ID, viewId);

      return c.json({ data: { $id: viewId } });
    }
  )

  // Duplicate a saved view
  .post(
    "/:viewId/duplicate",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).max(255),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { viewId } = c.req.param();
      const { name } = c.req.valid("json");

      const originalView = await databases.getDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        viewId
      );

      const member = await getMember({
        databases,
        workspaceId: originalView.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user can access original view
      if (originalView.userId !== user.$id && originalView.scope === SavedViewScope.PERSONAL) {
        return c.json({ error: "Access denied" }, 403);
      }

      const duplicatedView = await databases.createDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        ID.unique(),
        {
          workspaceId: originalView.workspaceId,
          projectId: originalView.projectId,
          spaceId: originalView.spaceId,
          name,
          description: originalView.description,
          type: originalView.type,
          scope: SavedViewScope.PERSONAL,
          filters: originalView.filters,
          columns: originalView.columns,
          sort: originalView.sort,
          kanbanConfig: originalView.kanbanConfig,
          calendarConfig: originalView.calendarConfig,
          timelineConfig: originalView.timelineConfig,
          quickFilters: originalView.quickFilters,
          isDefault: false,
          isPinned: false,
          icon: originalView.icon,
          color: originalView.color,
          userId: user.$id,
          position: 0,
        }
      );

      return c.json({ data: duplicatedView });
    }
  )

  // Get default view for a type
  .get(
    "/default/:viewType",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { viewType } = c.req.param();
      const { workspaceId, projectId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const queries: string[] = [
        Query.equal("workspaceId", workspaceId),
        Query.equal("userId", user.$id),
        Query.equal("type", viewType as SavedViewType),
        Query.equal("isDefault", true),
      ];

      if (projectId) {
        queries.push(
          Query.or([
            Query.isNull("projectId"),
            Query.equal("projectId", projectId),
          ])
        );
      }

      const defaultViews = await databases.listDocuments<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        queries
      );

      if (defaultViews.total > 0) {
        return c.json({ data: defaultViews.documents[0] });
      }

      // Return preset config if no saved default
      const presetKey = Object.keys(VIEW_PRESETS).find(
        (key) => VIEW_PRESETS[key as keyof typeof VIEW_PRESETS].type === viewType
      );
      const preset = presetKey ? VIEW_PRESETS[presetKey as keyof typeof VIEW_PRESETS] : null;
      
      return c.json({
        data: {
          type: viewType,
          name: preset?.name || `Default ${viewType}`,
          sort: preset && "sort" in preset ? preset.sort : null,
          quickFilters: preset && "quickFilters" in preset ? preset.quickFilters : null,
          filters: preset && "filters" in preset ? preset.filters : null,
          isDefault: true,
          isSystemDefault: true,
        },
      });
    }
  )

  // Initialize default views
  .post(
    "/initialize",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        viewTypes: z.array(z.nativeEnum(SavedViewType)).optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, projectId, viewTypes } = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const typesToCreate = viewTypes || Object.values(SavedViewType);
      const createdViews: SavedView[] = [];

      for (const viewType of typesToCreate) {
        // Check if default already exists
        const existingDefault = await databases.listDocuments<SavedView>(
          DATABASE_ID,
          SAVED_VIEWS_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", user.$id),
            Query.equal("type", viewType),
            Query.equal("isDefault", true),
          ]
        );

        if (existingDefault.total === 0) {
          // Find matching preset
          const presetKey = Object.keys(VIEW_PRESETS).find(
            (key) => VIEW_PRESETS[key as keyof typeof VIEW_PRESETS].type === viewType
          );
          const preset = presetKey ? VIEW_PRESETS[presetKey as keyof typeof VIEW_PRESETS] : null;

          const view = await databases.createDocument<SavedView>(
            DATABASE_ID,
            SAVED_VIEWS_ID,
            ID.unique(),
            {
              workspaceId,
              projectId: projectId || null,
              spaceId: null,
              name: preset?.name || `My ${viewType.replace(/_/g, " ")}`,
              description: `Default ${viewType.toLowerCase()} view`,
              type: viewType,
              scope: SavedViewScope.PERSONAL,
              filters: preset && "filters" in preset ? JSON.stringify(preset.filters) : null,
              columns: null,
              sort: preset && "sort" in preset ? JSON.stringify(preset.sort) : null,
              kanbanConfig: viewType === SavedViewType.KANBAN 
                ? JSON.stringify({ groupBy: "status", cardFields: ["title", "assignees", "priority"] })
                : null,
              calendarConfig: null,
              timelineConfig: null,
              quickFilters: preset && "quickFilters" in preset ? JSON.stringify(preset.quickFilters) : null,
              isDefault: true,
              isPinned: false,
              icon: null,
              color: null,
              userId: user.$id,
              position: 0,
            }
          );
          createdViews.push(view);
        }
      }

      return c.json({ data: createdViews });
    }
  );

export default app;
