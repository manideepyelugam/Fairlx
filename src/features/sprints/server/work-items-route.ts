import { ID, Query } from "node-appwrite";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { DATABASE_ID, WORK_ITEMS_ID, PROJECTS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";

import { getMember } from "@/features/members/utils";
import { Project } from "@/features/projects/types";

import {
  createWorkItemSchema,
  updateWorkItemSchema,
  bulkMoveWorkItemsSchema,
  reorderWorkItemsSchema,
  splitWorkItemSchema,
} from "../schemas";
import {
  WorkItem,
  WorkItemType,
  WorkItemStatus,
  WorkItemPriority,
  PopulatedWorkItem,
} from "../types";

// Generate unique work item key
async function generateWorkItemKey(
  databases: Awaited<ReturnType<typeof createAdminClient>>["databases"],
  projectId: string
): Promise<string> {
  const project = await databases.getDocument(
    DATABASE_ID,
    PROJECTS_ID,
    projectId
  ) as Project;

  // Get project prefix (first 3-4 letters of project name in uppercase)
  const prefix = project.name
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase() || "PROJ";

  // Get the count of work items in this project
  const workItems = await databases.listDocuments(
    DATABASE_ID,
    WORK_ITEMS_ID,
    [Query.equal("projectId", projectId), Query.limit(1)]
  );

  const count = workItems.total + 1;
  return `${prefix}-${count}`;
}

const app = new Hono()
  // Get work items with filters
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().optional(),
        sprintId: z.string().optional().nullable(),
        type: z.nativeEnum(WorkItemType).optional(),
        status: z.nativeEnum(WorkItemStatus).optional(),
        priority: z.nativeEnum(WorkItemPriority).optional(),
        assigneeId: z.string().optional(),
        epicId: z.string().optional().nullable(),
        parentId: z.string().optional().nullable(),
        flagged: z.string().transform(val => val === "true").optional(),
        search: z.string().optional(),
        includeChildren: z.string().transform(val => val === "true").optional(),
      })
    ),
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");

      const {
        workspaceId,
        projectId,
        sprintId,
        type,
        status,
        priority,
        assigneeId,
        epicId,
        parentId,
        flagged,
        search,
        includeChildren,
      } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const query = [
        Query.equal("workspaceId", workspaceId),
        Query.orderAsc("position"),
      ];

      if (projectId) {
        query.push(Query.equal("projectId", projectId));
      }

      if (sprintId !== undefined) {
        if (sprintId === null || sprintId === "null") {
          query.push(Query.isNull("sprintId"));
        } else {
          query.push(Query.equal("sprintId", sprintId));
        }
      }

      if (type) {
        query.push(Query.equal("type", type));
      }

      if (status) {
        query.push(Query.equal("status", status));
      }

      if (priority) {
        query.push(Query.equal("priority", priority));
      }

      if (assigneeId) {
        query.push(Query.equal("assigneeIds", assigneeId));
      }

      if (epicId !== undefined) {
        if (epicId === null || epicId === "null") {
          query.push(Query.isNull("epicId"));
        } else {
          query.push(Query.equal("epicId", epicId));
        }
      }

      if (parentId !== undefined) {
        if (parentId === null || parentId === "null") {
          query.push(Query.isNull("parentId"));
        } else {
          query.push(Query.equal("parentId", parentId));
        }
      }

      if (flagged) {
        query.push(Query.equal("flagged", true));
      }

      if (search) {
        query.push(Query.search("title", search));
      }

      const workItems = await databases.listDocuments<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        query
      );

      // Populate assignees and related items
      const populatedWorkItems = await Promise.all(
        workItems.documents.map(async (workItem) => {
          const assigneeResults = await Promise.all(
            workItem.assigneeIds.map(async (assigneeId) => {
              try {
                const assignee = await users.get(assigneeId);
                return {
                  $id: assignee.$id,
                  name: assignee.name,
                  email: assignee.email,
                  profileImageUrl: assignee.prefs?.profileImageUrl || null,
                };
              } catch {
                return null;
              }
            })
          );
          
          const assignees = assigneeResults.filter((a): a is NonNullable<typeof a> => a !== null);

          let epic = null;
          if (workItem.epicId) {
            try {
              const epicDoc = await databases.getDocument<WorkItem>(
                DATABASE_ID,
                WORK_ITEMS_ID,
                workItem.epicId
              );
              epic = {
                $id: epicDoc.$id,
                key: epicDoc.key,
                title: epicDoc.title,
              };
            } catch {
              // Epic might be deleted
            }
          }

          let parent = null;
          if (workItem.parentId) {
            try {
              const parentDoc = await databases.getDocument<WorkItem>(
                DATABASE_ID,
                WORK_ITEMS_ID,
                workItem.parentId
              );
              parent = {
                $id: parentDoc.$id,
                key: parentDoc.key,
                title: parentDoc.title,
              };
            } catch {
              // Parent might be deleted
            }
          }

          const children = await databases.listDocuments(
            DATABASE_ID,
            WORK_ITEMS_ID,
            [Query.equal("parentId", workItem.$id)]
          );

          let childrenData = undefined;
          if (includeChildren && children.total > 0) {
            childrenData = children.documents as PopulatedWorkItem[];
          }

          return {
            ...workItem,
            assignees,
            epic,
            parent,
            childrenCount: children.total,
            children: childrenData,
          };
        })
      );

      return c.json({
        data: {
          ...workItems,
          documents: populatedWorkItems,
        },
      });
    }
  )
  // Get a single work item
  .get(
    "/:workItemId",
    sessionMiddleware,
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");
      const { workItemId } = c.req.param();

      const workItem = await databases.getDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        workItemId
      );

      const member = await getMember({
        databases,
        workspaceId: workItem.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Populate assignees
      const assigneeResults = await Promise.all(
        workItem.assigneeIds.map(async (assigneeId) => {
          try {
            const assignee = await users.get(assigneeId);
            return {
              $id: assignee.$id,
              name: assignee.name,
              email: assignee.email,
              profileImageUrl: assignee.prefs?.profileImageUrl || null,
            };
          } catch {
            return null;
          }
        })
      );
      
      const assignees = assigneeResults.filter((a): a is NonNullable<typeof a> => a !== null);

      let epic = null;
      if (workItem.epicId) {
        try {
          const epicDoc = await databases.getDocument<WorkItem>(
            DATABASE_ID,
            WORK_ITEMS_ID,
            workItem.epicId
          );
          epic = {
            $id: epicDoc.$id,
            key: epicDoc.key,
            title: epicDoc.title,
          };
        } catch {
          // Epic might be deleted
        }
      }

      let parent = null;
      if (workItem.parentId) {
        try {
          const parentDoc = await databases.getDocument<WorkItem>(
            DATABASE_ID,
            WORK_ITEMS_ID,
            workItem.parentId
          );
          parent = {
            $id: parentDoc.$id,
            key: parentDoc.key,
            title: parentDoc.title,
          };
        } catch {
          // Parent might be deleted
        }
      }

      // Get children
      const children = await databases.listDocuments<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        [Query.equal("parentId", workItem.$id), Query.orderAsc("position")]
      );

      return c.json({
        data: {
          ...workItem,
          assignees,
          epic,
          parent,
          childrenCount: children.total,
          children: children.documents,
        },
      });
    }
  )
  // Create a new work item
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createWorkItemSchema),
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

      // Generate unique key
      const key = await generateWorkItemKey(databases, data.projectId);

      // Get the highest position
      const queryFilters = [
        Query.equal("projectId", data.projectId),
        Query.orderDesc("position"),
        Query.limit(1),
      ];

      if (data.sprintId) {
        queryFilters.push(Query.equal("sprintId", data.sprintId));
      } else {
        queryFilters.push(Query.isNull("sprintId"));
      }

      const workItems = await databases.listDocuments(
        DATABASE_ID,
        WORK_ITEMS_ID,
        queryFilters
      );

      const highestPosition =
        workItems.documents.length > 0 ? workItems.documents[0].position : 0;

      const workItem = await databases.createDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        ID.unique(),
        {
          ...data,
          key,
          position: highestPosition + 1000,
          dueDate: data.dueDate?.toISOString(),
        }
      );

      return c.json({ data: workItem });
    }
  )
  // Update a work item
  .patch(
    "/:workItemId",
    sessionMiddleware,
    zValidator("json", updateWorkItemSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workItemId } = c.req.param();

      const workItem = await databases.getDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        workItemId
      );

      const member = await getMember({
        databases,
        workspaceId: workItem.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updates = c.req.valid("json");

      const updatedWorkItem = await databases.updateDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        workItemId,
        {
          ...updates,
          dueDate: updates.dueDate?.toISOString(),
        }
      );

      return c.json({ data: updatedWorkItem });
    }
  )
  // Delete a work item
  .delete(
    "/:workItemId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workItemId } = c.req.param();

      const workItem = await databases.getDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        workItemId
      );

      const member = await getMember({
        databases,
        workspaceId: workItem.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Delete all children (subtasks)
      const children = await databases.listDocuments(
        DATABASE_ID,
        WORK_ITEMS_ID,
        [Query.equal("parentId", workItemId)]
      );

      await Promise.all(
        children.documents.map((child) =>
          databases.deleteDocument(DATABASE_ID, WORK_ITEMS_ID, child.$id)
        )
      );

      await databases.deleteDocument(DATABASE_ID, WORK_ITEMS_ID, workItemId);

      return c.json({ data: { $id: workItem.$id } });
    }
  )
  // Bulk move work items to a sprint
  .post(
    "/bulk-move",
    sessionMiddleware,
    zValidator("json", bulkMoveWorkItemsSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workItemIds, sprintId } = c.req.valid("json");

      // Verify user has access to the first work item (assume same workspace)
      const firstWorkItem = await databases.getDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        workItemIds[0]
      );

      const member = await getMember({
        databases,
        workspaceId: firstWorkItem.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedItems = await Promise.all(
        workItemIds.map((id) =>
          databases.updateDocument(DATABASE_ID, WORK_ITEMS_ID, id, {
            sprintId,
          })
        )
      );

      return c.json({ data: updatedItems });
    }
  )
  // Reorder work items
  .post(
    "/reorder",
    sessionMiddleware,
    zValidator("json", reorderWorkItemsSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workItemId, newPosition, sprintId } = c.req.valid("json");

      const workItem = await databases.getDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        workItemId
      );

      const member = await getMember({
        databases,
        workspaceId: workItem.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updateData: Partial<WorkItem> = { position: newPosition };
      if (sprintId !== undefined) {
        updateData.sprintId = sprintId;
      }

      const updatedWorkItem = await databases.updateDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        workItemId,
        updateData
      );

      return c.json({ data: updatedWorkItem });
    }
  )
  // Split work item
  .post(
    "/split",
    sessionMiddleware,
    zValidator("json", splitWorkItemSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { originalWorkItemId, newWorkItems } = c.req.valid("json");

      const originalWorkItem = await databases.getDocument<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        originalWorkItemId
      );

      const member = await getMember({
        databases,
        workspaceId: originalWorkItem.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Create new work items
      const createdItems = await Promise.all(
        newWorkItems.map(async (item, index) => {
          const key = await generateWorkItemKey(
            databases,
            originalWorkItem.projectId
          );

          return databases.createDocument<WorkItem>(
            DATABASE_ID,
            WORK_ITEMS_ID,
            ID.unique(),
            {
              title: item.title,
              key,
              type: originalWorkItem.type,
              status: originalWorkItem.status,
              priority: originalWorkItem.priority,
              storyPoints: item.storyPoints,
              workspaceId: originalWorkItem.workspaceId,
              projectId: originalWorkItem.projectId,
              sprintId: originalWorkItem.sprintId,
              epicId: originalWorkItem.epicId,
              assigneeIds: originalWorkItem.assigneeIds,
              flagged: false,
              position: originalWorkItem.position + (index + 1) * 100,
              labels: originalWorkItem.labels,
            }
          );
        })
      );

      return c.json({ data: { original: originalWorkItem, created: createdItems } });
    }
  )
  // Get epics (work items of type EPIC)
  .get(
    "/epics",
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

      const { workspaceId, projectId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const query = [
        Query.equal("workspaceId", workspaceId),
        Query.equal("type", WorkItemType.EPIC),
        Query.orderDesc("$createdAt"),
      ];

      if (projectId) {
        query.push(Query.equal("projectId", projectId));
      }

      const epics = await databases.listDocuments<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        query
      );

      return c.json({ data: epics });
    }
  );

export default app;
