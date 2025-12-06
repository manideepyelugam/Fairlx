import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { getMember } from "@/features/members/utils";

import {
  DATABASE_ID,
  CUSTOM_FIELDS_ID,
  CUSTOM_WORK_ITEM_TYPES_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import {
  createCustomFieldSchema,
  updateCustomFieldSchema,
  createCustomWorkItemTypeSchema,
  updateCustomWorkItemTypeSchema,
} from "../schemas";
import {
  CustomField,
  CustomWorkItemType,
  CUSTOM_FIELD_TEMPLATES,
  SYSTEM_WORK_ITEM_TYPES,
} from "../types";

const app = new Hono()
  // ============= Custom Fields =============

  // Create a custom field
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createCustomFieldSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const data = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId: data.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if key is unique within the workspace/project
      const existingField = await databases.listDocuments<CustomField>(
        DATABASE_ID,
        CUSTOM_FIELDS_ID,
        [
          Query.equal("workspaceId", data.workspaceId),
          Query.equal("key", data.key),
          ...(data.projectId ? [Query.equal("projectId", data.projectId)] : []),
        ]
      );

      if (existingField.total > 0) {
        return c.json({ error: "A field with this key already exists" }, 400);
      }

      const customField = await databases.createDocument<CustomField>(
        DATABASE_ID,
        CUSTOM_FIELDS_ID,
        ID.unique(),
        {
          workspaceId: data.workspaceId,
          projectId: data.projectId || null,
          spaceId: data.spaceId || null,
          name: data.name,
          key: data.key,
          description: data.description || null,
          type: data.type,
          scope: data.scope,
          options: data.options ? JSON.stringify(data.options) : null,
          defaultValue: data.defaultValue || null,
          placeholder: data.placeholder || null,
          isRequired: data.isRequired ?? false,
          minValue: data.minValue ?? null,
          maxValue: data.maxValue ?? null,
          precision: data.precision ?? null,
          currencySymbol: data.currencySymbol || null,
          currencyCode: data.currencyCode || null,
          appliesToTypes: data.appliesToTypes ? JSON.stringify(data.appliesToTypes) : null,
          showInList: data.showInList ?? true,
          showInCard: data.showInCard ?? false,
          position: 0,
          archived: false,
        }
      );

      return c.json({ data: customField });
    }
  )

  // List custom fields for a workspace/project
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
          spaceId: z.string().optional(),
        projectId: z.string().optional(),
        type: z.string().optional(),
        appliesTo: z.string().optional(),
        includeArchived: z.string().optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, projectId, spaceId, type, appliesTo, includeArchived } = c.req.valid("query");

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

      if (type) {
        queries.push(Query.equal("type", type));
      }

      if (includeArchived !== "true") {
        queries.push(Query.equal("archived", false));
      }

      const customFields = await databases.listDocuments<CustomField>(
        DATABASE_ID,
        CUSTOM_FIELDS_ID,
        queries
      );

      // Filter by appliesTo if specified
      let filteredFields = customFields.documents;
      if (appliesTo) {
        filteredFields = customFields.documents.filter((field) => {
          if (!field.appliesToTypes) return true;
          const types = typeof field.appliesToTypes === "string" 
            ? JSON.parse(field.appliesToTypes) 
            : field.appliesToTypes;
          return types.includes(appliesTo);
        });
      }

      return c.json({
        data: {
          documents: filteredFields,
          total: filteredFields.length,
        },
      });
    }
  )

  // Get a single custom field
  .get(
    "/:fieldId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { fieldId } = c.req.param();

      const customField = await databases.getDocument<CustomField>(
        DATABASE_ID,
        CUSTOM_FIELDS_ID,
        fieldId
      );

      const member = await getMember({
        databases,
        workspaceId: customField.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ data: customField });
    }
  )

  // Update a custom field
  .patch(
    "/:fieldId",
    sessionMiddleware,
    zValidator("json", updateCustomFieldSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { fieldId } = c.req.param();

      const updates = c.req.valid("json");

      const customField = await databases.getDocument<CustomField>(
        DATABASE_ID,
        CUSTOM_FIELDS_ID,
        fieldId
      );

      const member = await getMember({
        databases,
        workspaceId: customField.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.options !== undefined) updateData.options = JSON.stringify(updates.options);
      if (updates.defaultValue !== undefined) updateData.defaultValue = updates.defaultValue;
      if (updates.placeholder !== undefined) updateData.placeholder = updates.placeholder;
      if (updates.isRequired !== undefined) updateData.isRequired = updates.isRequired;
      if (updates.minValue !== undefined) updateData.minValue = updates.minValue;
      if (updates.maxValue !== undefined) updateData.maxValue = updates.maxValue;
      if (updates.precision !== undefined) updateData.precision = updates.precision;
      if (updates.appliesToTypes !== undefined) {
        updateData.appliesToTypes = JSON.stringify(updates.appliesToTypes);
      }
      if (updates.showInList !== undefined) updateData.showInList = updates.showInList;
      if (updates.showInCard !== undefined) updateData.showInCard = updates.showInCard;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.archived !== undefined) updateData.archived = updates.archived;

      const updatedField = await databases.updateDocument<CustomField>(
        DATABASE_ID,
        CUSTOM_FIELDS_ID,
        fieldId,
        updateData
      );

      return c.json({ data: updatedField });
    }
  )

  // Delete a custom field
  .delete(
    "/:fieldId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { fieldId } = c.req.param();

      const customField = await databases.getDocument<CustomField>(
        DATABASE_ID,
        CUSTOM_FIELDS_ID,
        fieldId
      );

      const member = await getMember({
        databases,
        workspaceId: customField.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      await databases.deleteDocument(DATABASE_ID, CUSTOM_FIELDS_ID, fieldId);

      return c.json({ data: { $id: fieldId } });
    }
  )

  // Reorder custom fields
  .post(
    "/reorder",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        fieldOrders: z.array(
          z.object({
            fieldId: z.string(),
            position: z.number(),
          })
        ),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, fieldOrders } = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      await Promise.all(
        fieldOrders.map(({ fieldId, position }) =>
          databases.updateDocument(DATABASE_ID, CUSTOM_FIELDS_ID, fieldId, {
            position,
          })
        )
      );

      return c.json({ data: { success: true } });
    }
  )

  // Initialize default fields from templates
  .post(
    "/initialize",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        templateKeys: z.array(z.string()).optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, projectId, templateKeys } = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get templates to create
      const templateEntries = Object.entries(CUSTOM_FIELD_TEMPLATES);
      const templatesToUse = templateKeys 
        ? templateEntries.filter(([key]) => templateKeys.includes(key))
        : templateEntries;

      const createdFields: CustomField[] = [];

      for (let i = 0; i < templatesToUse.length; i++) {
        const [, template] = templatesToUse[i];

        // Check if already exists
        const existingField = await databases.listDocuments<CustomField>(
          DATABASE_ID,
          CUSTOM_FIELDS_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.equal("key", template.key),
          ]
        );

        if (existingField.total === 0) {
          const field = await databases.createDocument<CustomField>(
            DATABASE_ID,
            CUSTOM_FIELDS_ID,
            ID.unique(),
            {
              workspaceId,
              projectId: projectId || null,
              spaceId: null,
              name: template.name,
              key: template.key,
              description: null,
              type: template.type,
              scope: "PROJECT",
              options: "options" in template && template.options ? JSON.stringify(template.options) : null,
              defaultValue: null,
              placeholder: null,
              isRequired: false,
              minValue: (template as { minValue?: number }).minValue ?? null,
              maxValue: (template as { maxValue?: number }).maxValue ?? null,
              precision: null,
              currencySymbol: null,
              currencyCode: null,
              appliesToTypes: (template as { appliesToTypes?: string[] }).appliesToTypes 
                ? JSON.stringify((template as { appliesToTypes?: string[] }).appliesToTypes) 
                : null,
              showInList: true,
              showInCard: false,
              position: i,
              archived: false,
            }
          );
          createdFields.push(field);
        }
      }

      return c.json({ data: createdFields });
    }
  )

  // ============= Custom Work Item Types =============

  // Create a custom work item type
  .post(
    "/types",
    sessionMiddleware,
    zValidator("json", createCustomWorkItemTypeSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const data = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId: data.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if key is unique
      const existingType = await databases.listDocuments<CustomWorkItemType>(
        DATABASE_ID,
        CUSTOM_WORK_ITEM_TYPES_ID,
        [
          Query.equal("workspaceId", data.workspaceId),
          Query.equal("key", data.key),
        ]
      );

      if (existingType.total > 0) {
        return c.json({ error: "A work item type with this key already exists" }, 400);
      }

      const workItemType = await databases.createDocument<CustomWorkItemType>(
        DATABASE_ID,
        CUSTOM_WORK_ITEM_TYPES_ID,
        ID.unique(),
        {
          workspaceId: data.workspaceId,
          spaceId: data.spaceId || null,
          name: data.name,
          key: data.key,
          description: data.description || null,
          icon: data.icon,
          color: data.color,
          defaultWorkflowId: data.defaultWorkflowId || null,
          defaultFields: data.defaultFields || [],
          requiredFields: data.requiredFields || [],
          canHaveParent: data.canHaveParent ?? true,
          canHaveChildren: data.canHaveChildren ?? true,
          allowedParentTypes: data.allowedParentTypes || [],
          allowedChildTypes: data.allowedChildTypes || [],
          position: 0,
          isSystem: false,
          archived: false,
        }
      );

      return c.json({ data: workItemType });
    }
  )

  // List custom work item types
  .get(
    "/types",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        includeSubtasks: z.string().optional(),
        activeOnly: z.string().optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, projectId, activeOnly } = c.req.valid("query");

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
        Query.orderAsc("position"),
      ];

      if (projectId) {
        queries.push(
          Query.or([
            Query.isNull("spaceId"),
            Query.equal("spaceId", projectId),
          ])
        );
      }

      if (activeOnly === "true") {
        queries.push(Query.equal("archived", false));
      }

      const workItemTypes = await databases.listDocuments<CustomWorkItemType>(
        DATABASE_ID,
        CUSTOM_WORK_ITEM_TYPES_ID,
        queries
      );

      return c.json({ data: workItemTypes });
    }
  )

  // Get a single work item type
  .get(
    "/types/:typeId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { typeId } = c.req.param();

      const workItemType = await databases.getDocument<CustomWorkItemType>(
        DATABASE_ID,
        CUSTOM_WORK_ITEM_TYPES_ID,
        typeId
      );

      const member = await getMember({
        databases,
        workspaceId: workItemType.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ data: workItemType });
    }
  )

  // Update a custom work item type
  .patch(
    "/types/:typeId",
    sessionMiddleware,
    zValidator("json", updateCustomWorkItemTypeSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { typeId } = c.req.param();

      const updates = c.req.valid("json");

      const workItemType = await databases.getDocument<CustomWorkItemType>(
        DATABASE_ID,
        CUSTOM_WORK_ITEM_TYPES_ID,
        typeId
      );

      const member = await getMember({
        databases,
        workspaceId: workItemType.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.defaultWorkflowId !== undefined) updateData.defaultWorkflowId = updates.defaultWorkflowId;
      if (updates.defaultFields !== undefined) updateData.defaultFields = updates.defaultFields;
      if (updates.requiredFields !== undefined) updateData.requiredFields = updates.requiredFields;
      if (updates.canHaveParent !== undefined) updateData.canHaveParent = updates.canHaveParent;
      if (updates.canHaveChildren !== undefined) updateData.canHaveChildren = updates.canHaveChildren;
      if (updates.allowedParentTypes !== undefined) updateData.allowedParentTypes = updates.allowedParentTypes;
      if (updates.allowedChildTypes !== undefined) updateData.allowedChildTypes = updates.allowedChildTypes;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.archived !== undefined) updateData.archived = updates.archived;

      const updatedType = await databases.updateDocument<CustomWorkItemType>(
        DATABASE_ID,
        CUSTOM_WORK_ITEM_TYPES_ID,
        typeId,
        updateData
      );

      return c.json({ data: updatedType });
    }
  )

  // Delete a custom work item type
  .delete(
    "/types/:typeId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { typeId } = c.req.param();

      const workItemType = await databases.getDocument<CustomWorkItemType>(
        DATABASE_ID,
        CUSTOM_WORK_ITEM_TYPES_ID,
        typeId
      );

      const member = await getMember({
        databases,
        workspaceId: workItemType.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Don't allow deleting system types
      if (workItemType.isSystem) {
        return c.json({ error: "Cannot delete system work item types" }, 400);
      }

      await databases.deleteDocument(DATABASE_ID, CUSTOM_WORK_ITEM_TYPES_ID, typeId);

      return c.json({ data: { $id: typeId } });
    }
  )

  // Initialize default work item types from templates
  .post(
    "/types/initialize",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        spaceId: z.string().optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, spaceId } = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const createdTypes: CustomWorkItemType[] = [];

      for (let i = 0; i < SYSTEM_WORK_ITEM_TYPES.length; i++) {
        const template = SYSTEM_WORK_ITEM_TYPES[i];

        // Check if already exists
        const existingType = await databases.listDocuments<CustomWorkItemType>(
          DATABASE_ID,
          CUSTOM_WORK_ITEM_TYPES_ID,
          [
            Query.equal("workspaceId", workspaceId),
            Query.equal("key", template.key),
          ]
        );

        if (existingType.total === 0) {
          const type = await databases.createDocument<CustomWorkItemType>(
            DATABASE_ID,
            CUSTOM_WORK_ITEM_TYPES_ID,
            ID.unique(),
            {
              workspaceId,
              spaceId: spaceId || null,
              name: template.name,
              key: template.key,
              description: null,
              icon: template.icon,
              color: template.color,
              defaultWorkflowId: null,
              defaultFields: [],
              requiredFields: [],
              canHaveParent: template.canHaveParent,
              canHaveChildren: template.canHaveChildren,
              allowedParentTypes: template.allowedParentTypes,
              allowedChildTypes: template.allowedChildTypes,
              position: i,
              isSystem: true,
              archived: false,
            }
          );
          createdTypes.push(type);
        }
      }

      return c.json({ data: createdTypes });
    }
  );

export default app;
