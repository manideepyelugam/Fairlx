import { ID, Query } from "node-appwrite";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { DATABASE_ID, SPRINTS_ID, WORK_ITEMS_ID, MEMBERS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { can } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

import { getMember } from "@/features/members/utils";
import { logComputeUsage, getComputeUnits } from "@/lib/usage-metering";

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
      // First collect all unique assignee IDs (these are member document IDs)
      const allAssigneeIds = new Set<string>();
      workItems.documents.forEach((workItem) => {
        if (workItem.assigneeIds && Array.isArray(workItem.assigneeIds)) {
          workItem.assigneeIds.forEach(id => {
            if (id && typeof id === 'string') {
              allAssigneeIds.add(id);
            }
          });
        }
      });

      // Fetch all members at once
      const membersData = allAssigneeIds.size > 0
        ? await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_ID,
          [Query.equal("$id", Array.from(allAssigneeIds))]
        )
        : { documents: [] };

      // Build a map of member ID -> user data for quick lookup
      const assigneeMap = new Map<string, { $id: string; name: string; email: string; profileImageUrl: string | null }>();

      await Promise.all(
        membersData.documents.map(async (memberDoc) => {
          try {
            const userInfo = await users.get(memberDoc.userId);
            assigneeMap.set(memberDoc.$id, {
              $id: memberDoc.$id,
              name: userInfo.name || userInfo.email,
              email: userInfo.email,
              profileImageUrl: userInfo.prefs?.profileImageUrl || null,
            });
          } catch {
            // User not found - skip this member
          }
        })
      );

      const populatedWorkItems = await Promise.all(
        workItems.documents.map(async (workItem) => {
          // Get assignees from the pre-built map
          const assignees = (workItem.assigneeIds || [])
            .map(id => assigneeMap.get(id))
            .filter((a): a is NonNullable<typeof a> => a !== null);

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

      if (!(await can(databases, workspaceId, user.$id, PERMISSIONS.SPRINT_CREATE))) {
        return c.json({ error: "Forbidden" }, 403);
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

      // Log usage for sprint creation
      logComputeUsage({
        databases,
        workspaceId,
        projectId,
        units: getComputeUnits('sprint_create'),
        jobType: 'sprint_create',
        metadata: { sprintId: sprint.$id, sprintName: name },
      });

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

      // Permission Check
      if (updates.status) {
        if (updates.status === SprintStatus.ACTIVE && sprint.status !== SprintStatus.ACTIVE) {
          if (!(await can(databases, sprint.workspaceId, user.$id, PERMISSIONS.SPRINT_START))) {
            return c.json({ error: "Forbidden: Cannot start sprint" }, 403);
          }
        } else if (updates.status === SprintStatus.COMPLETED && sprint.status !== SprintStatus.COMPLETED) {
          if (!(await can(databases, sprint.workspaceId, user.$id, PERMISSIONS.SPRINT_COMPLETE))) {
            return c.json({ error: "Forbidden: Cannot complete sprint" }, 403);
          }
        }
      }

      // General Permission Check
      // If we authorized a status change above, we still need to check if *other* fields are being changed that require EDIT permission.
      // Or, we can simplify: if they passed the Status check and ONLY status is changing, they are good.
      // If they are changing other things (name, dates), they need EDIT_SPRINTS.

      const isStatusChangeOnly = Object.keys(updates).length === 1 && updates.status;
      const hasEditPermission = await can(databases, sprint.workspaceId, user.$id, PERMISSIONS.SPRINT_UPDATE);

      if (!isStatusChangeOnly && !hasEditPermission) {
        return c.json({ error: "Forbidden: Needs Edit Sprints permission" }, 403);
      }

      // If it IS a status change only, we already checked the specific permissions above (SPRINT_START / SPRINT_COMPLETE).
      // But we need to make sure we didn't skip verification.
      if (isStatusChangeOnly) {
        // The checks above (lines 348-358) handle START/COMPLETE logic.
        // If we are here, and it was a status change, and we didn't return 403 above, we are safe.
        // BUT, what if status is changing to something else? (e.g. back to PLANNED?)
        // For now, let's assume those 2 are the main ones.
        // If the status transition wasn't guarded above, we should enforce EDIT_SPRINTS.
        const isGuardedTransition =
          (updates.status === SprintStatus.ACTIVE && sprint.status !== SprintStatus.ACTIVE) ||
          (updates.status === SprintStatus.COMPLETED && sprint.status !== SprintStatus.COMPLETED);

        if (!isGuardedTransition && !hasEditPermission) {
          return c.json({ error: "Forbidden" }, 403);
        }
      }

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

      // Log usage for sprint update
      const isComplete = updates.status === SprintStatus.COMPLETED;
      logComputeUsage({
        databases,
        workspaceId: sprint.workspaceId,
        projectId: sprint.projectId,
        units: getComputeUnits(isComplete ? 'sprint_complete' : 'task_update'),
        jobType: isComplete ? 'sprint_complete' : 'sprint_update',
        metadata: { sprintId, updatedFields: Object.keys(updates) },
      });

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

      if (!(await can(databases, sprint.workspaceId, user.$id, PERMISSIONS.SPRINT_DELETE))) {
        return c.json({ error: "Forbidden" }, 403);
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

      // Log usage for sprint deletion
      logComputeUsage({
        databases,
        workspaceId: sprint.workspaceId,
        projectId: sprint.projectId,
        units: getComputeUnits('task_delete'),
        jobType: 'sprint_delete',
        metadata: { sprintId, movedItems: workItems.total },
      });

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
