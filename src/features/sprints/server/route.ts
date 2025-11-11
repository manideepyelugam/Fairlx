import { ID, Query } from "node-appwrite";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { DATABASE_ID, SPRINTS_ID, WORK_ITEMS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";

import { getMember } from "@/features/members/utils";

import {
  createSprintSchema,
  updateSprintSchema,
  reorderSprintsSchema,
} from "../schemas";
import { Sprint, SprintStatus, PopulatedSprint, WorkItem } from "../types";

const app = new Hono()
  // Get all sprints for a project
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string(),
        status: z.nativeEnum(SprintStatus).optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, projectId, status } = c.req.valid("query");

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
        Query.equal("projectId", projectId),
        Query.orderAsc("position"),
      ];

      if (status) {
        query.push(Query.equal("status", status));
      }

      const sprints = await databases.listDocuments<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        query
      );

      // Populate work items count and points for each sprint
      const populatedSprints: PopulatedSprint[] = await Promise.all(
        sprints.documents.map(async (sprint) => {
          const workItems = await databases.listDocuments<WorkItem>(
            DATABASE_ID,
            WORK_ITEMS_ID,
            [Query.equal("sprintId", sprint.$id)]
          );

          const totalPoints = workItems.documents.reduce(
            (sum, item) => sum + (item.storyPoints || 0),
            0
          );

          const completedPoints = workItems.documents
            .filter((item) => item.status === "DONE")
            .reduce((sum, item) => sum + (item.storyPoints || 0), 0);

          return {
            ...sprint,
            workItemCount: workItems.total,
            totalPoints,
            completedPoints,
          };
        })
      );

      return c.json({
        data: {
          ...sprints,
          documents: populatedSprints,
        },
      });
    }
  )
  // Get a single sprint with work items
  .get(
    "/:sprintId",
    sessionMiddleware,
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");
      const { sprintId } = c.req.param();

      const sprint = await databases.getDocument<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        sprintId
      );

      const member = await getMember({
        databases,
        workspaceId: sprint.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get all work items for this sprint
      const workItems = await databases.listDocuments<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        [
          Query.equal("sprintId", sprintId),
          Query.orderAsc("position"),
        ]
      );

      // Populate assignees for work items
      const populatedWorkItems = await Promise.all(
        workItems.documents.map(async (workItem) => {
          const assignees = await Promise.all(
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

          // Get epic info if exists
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

          // Get parent info if exists
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

          // Count children
          const children = await databases.listDocuments(
            DATABASE_ID,
            WORK_ITEMS_ID,
            [Query.equal("parentId", workItem.$id)]
          );

          return {
            ...workItem,
            assignees: assignees.filter(Boolean),
            epic,
            parent,
            childrenCount: children.total,
          };
        })
      );

      const totalPoints = populatedWorkItems.reduce(
        (sum, item) => sum + (item.storyPoints || 0),
        0
      );

      const completedPoints = populatedWorkItems
        .filter((item) => item.status === "DONE")
        .reduce((sum, item) => sum + (item.storyPoints || 0), 0);

      return c.json({
        data: {
          ...sprint,
          workItems: populatedWorkItems,
          workItemCount: workItems.total,
          totalPoints,
          completedPoints,
        },
      });
    }
  )
  // Create a new sprint
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createSprintSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { name, workspaceId, projectId, status, startDate, endDate, goal } =
        c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get the highest position
      const sprints = await databases.listDocuments(
        DATABASE_ID,
        SPRINTS_ID,
        [
          Query.equal("projectId", projectId),
          Query.orderDesc("position"),
          Query.limit(1),
        ]
      );

      const highestPosition =
        sprints.documents.length > 0 ? sprints.documents[0].position : 0;

      const sprint = await databases.createDocument<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        ID.unique(),
        {
          name,
          workspaceId,
          projectId,
          status: status || SprintStatus.PLANNED,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          goal,
          position: highestPosition + 1000,
        }
      );

      return c.json({ data: sprint });
    }
  )
  // Update a sprint
  .patch(
    "/:sprintId",
    sessionMiddleware,
    zValidator("json", updateSprintSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { sprintId } = c.req.param();

      const sprint = await databases.getDocument<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        sprintId
      );

      const member = await getMember({
        databases,
        workspaceId: sprint.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updates = c.req.valid("json");

      const updateData = {
        ...updates,
        startDate: updates.startDate?.toISOString(),
        endDate: updates.endDate?.toISOString(),
      };
      (updateData as Record<string, unknown>).lastModifiedBy = user.$id;

      const updatedSprint = await databases.updateDocument<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        sprintId,
        updateData
      );

      return c.json({ data: updatedSprint });
    }
  )
  // Delete a sprint
  .delete(
    "/:sprintId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { sprintId } = c.req.param();

      const sprint = await databases.getDocument<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        sprintId
      );

      const member = await getMember({
        databases,
        workspaceId: sprint.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Move all work items in this sprint to backlog (null sprint)
      const workItems = await databases.listDocuments<WorkItem>(
        DATABASE_ID,
        WORK_ITEMS_ID,
        [Query.equal("sprintId", sprintId)]
      );

      await Promise.all(
        workItems.documents.map((workItem) =>
          databases.updateDocument(
            DATABASE_ID,
            WORK_ITEMS_ID,
            workItem.$id,
            { sprintId: null, lastModifiedBy: user.$id }
          )
        )
      );

      await databases.deleteDocument(DATABASE_ID, SPRINTS_ID, sprintId);

      return c.json({ data: { $id: sprint.$id } });
    }
  )
  // Reorder sprints
  .post(
    "/reorder",
    sessionMiddleware,
    zValidator("json", reorderSprintsSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { sprintId, newPosition } = c.req.valid("json");

      const sprint = await databases.getDocument<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        sprintId
      );

      const member = await getMember({
        databases,
        workspaceId: sprint.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedSprint = await databases.updateDocument<Sprint>(
        DATABASE_ID,
        SPRINTS_ID,
        sprintId,
        { position: newPosition, lastModifiedBy: user.$id }
      );

      return c.json({ data: updatedSprint });
    }
  );

export default app;
