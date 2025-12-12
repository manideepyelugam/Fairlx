import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";

import {
  DATABASE_ID,
  WORKFLOWS_ID,
  WORKFLOW_STATUSES_ID,
  WORKFLOW_TRANSITIONS_ID,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import {
  createWorkflowSchema,
  updateWorkflowSchema,
  createWorkflowStatusSchema,
  updateWorkflowStatusSchema,
  createWorkflowTransitionSchema,
  updateWorkflowTransitionSchema,
} from "../schemas";
import {
  Workflow,
  WorkflowStatus,
  WorkflowTransition,
  PopulatedWorkflow,
  DEFAULT_SOFTWARE_WORKFLOW,
} from "../types";

const app = new Hono()
  // Create a new workflow
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", createWorkflowSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const {
        name,
        key,
        description,
        workspaceId,
        spaceId,
        projectId,
        isDefault,
        copyFromWorkflowId,
      } = c.req.valid("json");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can create workflows" }, 403);
      }

      // Create the workflow
      const workflow = await databases.createDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        ID.unique(),
        {
          name,
          key,
          description: description || null,
          workspaceId,
          spaceId: spaceId || null,
          projectId: projectId || null,
          isDefault: isDefault || false,
        }
      );

      // If copying from existing workflow
      if (copyFromWorkflowId) {
        const sourceStatuses = await databases.listDocuments<WorkflowStatus>(
          DATABASE_ID,
          WORKFLOW_STATUSES_ID,
          [Query.equal("workflowId", copyFromWorkflowId), Query.orderAsc("position")]
        );

        const sourceTransitions = await databases.listDocuments<WorkflowTransition>(
          DATABASE_ID,
          WORKFLOW_TRANSITIONS_ID,
          [Query.equal("workflowId", copyFromWorkflowId)]
        );

        // Copy statuses and create mapping
        const statusIdMap: Record<string, string> = {};
        for (const status of sourceStatuses.documents) {
          const newStatus = await databases.createDocument<WorkflowStatus>(
            DATABASE_ID,
            WORKFLOW_STATUSES_ID,
            ID.unique(),
            {
              workflowId: workflow.$id,
              name: status.name,
              key: status.key,
              category: status.category,
              color: status.color,
              description: status.description,
              position: status.position,
              positionX: status.positionX || 0,
              positionY: status.positionY || 0,
              isInitial: status.isInitial,
              isFinal: status.isFinal,
            }
          );
          statusIdMap[status.$id] = newStatus.$id;
        }

        // Copy transitions with mapped status IDs
        for (const transition of sourceTransitions.documents) {
          const newFromId = statusIdMap[transition.fromStatusId];
          const newToId = statusIdMap[transition.toStatusId];
          if (newFromId && newToId) {
            await databases.createDocument<WorkflowTransition>(
              DATABASE_ID,
              WORKFLOW_TRANSITIONS_ID,
              ID.unique(),
              {
                workflowId: workflow.$id,
                fromStatusId: newFromId,
                toStatusId: newToId,
                name: transition.name,
                description: transition.description,
                requiredFields: transition.requiredFields,
                allowedRoles: transition.allowedRoles,
                autoAssign: transition.autoAssign,
              }
            );
          }
        }
      } else {
        // Create default statuses from template
        const template = DEFAULT_SOFTWARE_WORKFLOW;
        const statusIdMap: Record<string, string> = {};

        for (const statusDef of template.statuses) {
          const status = await databases.createDocument<WorkflowStatus>(
            DATABASE_ID,
            WORKFLOW_STATUSES_ID,
            ID.unique(),
            {
              workflowId: workflow.$id,
              name: statusDef.name,
              key: statusDef.key,
              category: statusDef.category,
              color: statusDef.color,
              position: statusDef.position,
              positionX: statusDef.positionX || (statusDef.position * 250),
              positionY: statusDef.positionY || 100,
              isInitial: statusDef.isInitial,
              isFinal: statusDef.isFinal,
            }
          );
          statusIdMap[statusDef.key] = status.$id;
        }

        // Create transitions
        if (template.transitions === "ALL") {
          // Create transitions between all status pairs
          const statusKeys = Object.keys(statusIdMap);
          for (const fromKey of statusKeys) {
            for (const toKey of statusKeys) {
              if (fromKey !== toKey) {
                await databases.createDocument<WorkflowTransition>(
                  DATABASE_ID,
                  WORKFLOW_TRANSITIONS_ID,
                  ID.unique(),
                  {
                    workflowId: workflow.$id,
                    fromStatusId: statusIdMap[fromKey],
                    toStatusId: statusIdMap[toKey],
                    autoAssign: false,
                  }
                );
              }
            }
          }
        } else {
          // Create transitions from template
          for (const transitionDef of template.transitions) {
            const fromId = statusIdMap[transitionDef.from];
            const toId = statusIdMap[transitionDef.to];
            if (fromId && toId) {
              await databases.createDocument<WorkflowTransition>(
                DATABASE_ID,
                WORKFLOW_TRANSITIONS_ID,
                ID.unique(),
                {
                  workflowId: workflow.$id,
                  fromStatusId: fromId,
                  toStatusId: toId,
                  autoAssign: false,
                }
              );
            }
          }
        }
      }

      return c.json({ data: workflow });
    }
  )

  // Get all workflows for a workspace/space/project
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        spaceId: z.string().optional(),
        projectId: z.string().optional(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId, spaceId, projectId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const queries = [Query.equal("workspaceId", workspaceId)];
      
      if (projectId) {
        queries.push(Query.equal("projectId", projectId));
      } else if (spaceId) {
        queries.push(Query.equal("spaceId", spaceId));
      }

      const workflows = await databases.listDocuments<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        queries
      );

      // Populate with status counts
      const populatedWorkflows: PopulatedWorkflow[] = await Promise.all(
        workflows.documents.map(async (workflow) => {
          const statuses = await databases.listDocuments<WorkflowStatus>(
            DATABASE_ID,
            WORKFLOW_STATUSES_ID,
            [Query.equal("workflowId", workflow.$id)]
          );

          return {
            ...workflow,
            statusCount: statuses.total,
          };
        })
      );

      return c.json({ data: { documents: populatedWorkflows, total: populatedWorkflows.length } });
    }
  )

  // Get a single workflow with all statuses and transitions
  .get("/:workflowId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workflowId } = c.req.param();

    const workflow = await databases.getDocument<Workflow>(
      DATABASE_ID,
      WORKFLOWS_ID,
      workflowId
    );

    const member = await getMember({
      databases,
      workspaceId: workflow.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const statuses = await databases.listDocuments<WorkflowStatus>(
      DATABASE_ID,
      WORKFLOW_STATUSES_ID,
      [Query.equal("workflowId", workflowId), Query.orderAsc("position")]
    );

    const transitions = await databases.listDocuments<WorkflowTransition>(
      DATABASE_ID,
      WORKFLOW_TRANSITIONS_ID,
      [Query.equal("workflowId", workflowId)]
    );

    const populatedWorkflow: PopulatedWorkflow = {
      ...workflow,
      statuses: statuses.documents,
      transitions: transitions.documents,
      statusCount: statuses.total,
    };

    return c.json({ data: populatedWorkflow });
  })

  // Update a workflow
  .patch(
    "/:workflowId",
    sessionMiddleware,
    zValidator("json", updateWorkflowSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId } = c.req.param();

      const updates = c.req.valid("json");

      const workflow = await databases.getDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId
      );

      if (workflow.isSystem) {
        return c.json({ error: "Cannot modify system workflows" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId: workflow.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can update workflows" }, 403);
      }

      const updatedWorkflow = await databases.updateDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId,
        updates
      );

      return c.json({ data: updatedWorkflow });
    }
  )

  // Delete a workflow
  .delete("/:workflowId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workflowId } = c.req.param();

    const workflow = await databases.getDocument<Workflow>(
      DATABASE_ID,
      WORKFLOWS_ID,
      workflowId
    );

    if (workflow.isSystem) {
      return c.json({ error: "Cannot delete system workflows" }, 400);
    }

    const member = await getMember({
      databases,
      workspaceId: workflow.workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Only admins can delete workflows" }, 403);
    }

    // Delete all statuses and transitions
    const statuses = await databases.listDocuments<WorkflowStatus>(
      DATABASE_ID,
      WORKFLOW_STATUSES_ID,
      [Query.equal("workflowId", workflowId)]
    );

    const transitions = await databases.listDocuments<WorkflowTransition>(
      DATABASE_ID,
      WORKFLOW_TRANSITIONS_ID,
      [Query.equal("workflowId", workflowId)]
    );

    await Promise.all([
      ...statuses.documents.map((s) =>
        databases.deleteDocument(DATABASE_ID, WORKFLOW_STATUSES_ID, s.$id)
      ),
      ...transitions.documents.map((t) =>
        databases.deleteDocument(DATABASE_ID, WORKFLOW_TRANSITIONS_ID, t.$id)
      ),
    ]);

    await databases.deleteDocument(DATABASE_ID, WORKFLOWS_ID, workflowId);

    return c.json({ data: { $id: workflowId } });
  })

  // ============ Status endpoints ============

  // Add a status to a workflow
  .post(
    "/:workflowId/statuses",
    sessionMiddleware,
    zValidator("json", createWorkflowStatusSchema.omit({ workflowId: true })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId } = c.req.param();

      const statusData = c.req.valid("json");

      const workflow = await databases.getDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId
      );

      if (workflow.isSystem) {
        return c.json({ error: "Cannot modify system workflows" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId: workflow.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can add statuses" }, 403);
      }

      // Check for duplicate key
      const existingStatuses = await databases.listDocuments<WorkflowStatus>(
        DATABASE_ID,
        WORKFLOW_STATUSES_ID,
        [Query.equal("workflowId", workflowId), Query.equal("key", statusData.key)]
      );

      if (existingStatuses.total > 0) {
        return c.json({ error: "Status key already exists in this workflow" }, 400);
      }

      // Get max position if not provided
      let position = statusData.position;
      if (position === undefined) {
        const allStatuses = await databases.listDocuments<WorkflowStatus>(
          DATABASE_ID,
          WORKFLOW_STATUSES_ID,
          [Query.equal("workflowId", workflowId), Query.orderDesc("position")]
        );
        position = (allStatuses.documents[0]?.position ?? -1) + 1;
      }

      const status = await databases.createDocument<WorkflowStatus>(
        DATABASE_ID,
        WORKFLOW_STATUSES_ID,
        ID.unique(),
        {
          workflowId,
          name: statusData.name,
          key: statusData.key,
          category: statusData.category,
          color: statusData.color,
          description: statusData.description || null,
          position,
          positionX: statusData.positionX || 0,
          positionY: statusData.positionY || 0,
          isInitial: statusData.isInitial || false,
          isFinal: statusData.isFinal || false,
        }
      );

      return c.json({ data: status });
    }
  )

  // Get all statuses for a workflow
  .get("/:workflowId/statuses", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workflowId } = c.req.param();

    const workflow = await databases.getDocument<Workflow>(
      DATABASE_ID,
      WORKFLOWS_ID,
      workflowId
    );

    const member = await getMember({
      databases,
      workspaceId: workflow.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const statuses = await databases.listDocuments<WorkflowStatus>(
      DATABASE_ID,
      WORKFLOW_STATUSES_ID,
      [Query.equal("workflowId", workflowId), Query.orderAsc("position")]
    );

    return c.json({ data: statuses });
  })

  // Update a status
  .patch(
    "/:workflowId/statuses/:statusId",
    sessionMiddleware,
    zValidator("json", updateWorkflowStatusSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId, statusId } = c.req.param();

      const updates = c.req.valid("json");

      const workflow = await databases.getDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId
      );

      if (workflow.isSystem) {
        return c.json({ error: "Cannot modify system workflows" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId: workflow.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can update statuses" }, 403);
      }

      const updatedStatus = await databases.updateDocument<WorkflowStatus>(
        DATABASE_ID,
        WORKFLOW_STATUSES_ID,
        statusId,
        updates
      );

      return c.json({ data: updatedStatus });
    }
  )

  // Delete a status
  .delete("/:workflowId/statuses/:statusId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workflowId, statusId } = c.req.param();

    const workflow = await databases.getDocument<Workflow>(
      DATABASE_ID,
      WORKFLOWS_ID,
      workflowId
    );

    if (workflow.isSystem) {
      return c.json({ error: "Cannot modify system workflows" }, 400);
    }

    const member = await getMember({
      databases,
      workspaceId: workflow.workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Only admins can delete statuses" }, 403);
    }

    // Delete associated transitions
    const transitions = await databases.listDocuments<WorkflowTransition>(
      DATABASE_ID,
      WORKFLOW_TRANSITIONS_ID,
      [
        Query.equal("workflowId", workflowId),
        Query.or([
          Query.equal("fromStatusId", statusId),
          Query.equal("toStatusId", statusId),
        ]),
      ]
    );

    await Promise.all(
      transitions.documents.map((t) =>
        databases.deleteDocument(DATABASE_ID, WORKFLOW_TRANSITIONS_ID, t.$id)
      )
    );

    await databases.deleteDocument(DATABASE_ID, WORKFLOW_STATUSES_ID, statusId);

    return c.json({ data: { $id: statusId } });
  })

  // ============ Transition endpoints ============

  // Add a transition
  .post(
    "/:workflowId/transitions",
    sessionMiddleware,
    zValidator("json", createWorkflowTransitionSchema.omit({ workflowId: true })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId } = c.req.param();

      const transitionData = c.req.valid("json");

      const workflow = await databases.getDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId
      );

      if (workflow.isSystem) {
        return c.json({ error: "Cannot modify system workflows" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId: workflow.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can add transitions" }, 403);
      }

      // Check if transition already exists
      const existingTransitions = await databases.listDocuments<WorkflowTransition>(
        DATABASE_ID,
        WORKFLOW_TRANSITIONS_ID,
        [
          Query.equal("workflowId", workflowId),
          Query.equal("fromStatusId", transitionData.fromStatusId),
          Query.equal("toStatusId", transitionData.toStatusId),
        ]
      );

      if (existingTransitions.total > 0) {
        return c.json({ error: "Transition already exists" }, 400);
      }

      const transition = await databases.createDocument<WorkflowTransition>(
        DATABASE_ID,
        WORKFLOW_TRANSITIONS_ID,
        ID.unique(),
        {
          workflowId,
          fromStatusId: transitionData.fromStatusId,
          toStatusId: transitionData.toStatusId,
          name: transitionData.name || null,
          description: transitionData.description || null,
          requiredFields: transitionData.requiredFields || null,
          allowedRoles: transitionData.allowedRoles || null,
          autoAssign: transitionData.autoAssign || false,
        }
      );

      return c.json({ data: transition });
    }
  )

  // Get all transitions for a workflow
  .get("/:workflowId/transitions", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workflowId } = c.req.param();

    const workflow = await databases.getDocument<Workflow>(
      DATABASE_ID,
      WORKFLOWS_ID,
      workflowId
    );

    const member = await getMember({
      databases,
      workspaceId: workflow.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const transitions = await databases.listDocuments<WorkflowTransition>(
      DATABASE_ID,
      WORKFLOW_TRANSITIONS_ID,
      [Query.equal("workflowId", workflowId)]
    );

    return c.json({ data: transitions });
  })

  // Update a transition
  .patch(
    "/:workflowId/transitions/:transitionId",
    sessionMiddleware,
    zValidator("json", updateWorkflowTransitionSchema),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId, transitionId } = c.req.param();

      const updates = c.req.valid("json");

      const workflow = await databases.getDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId
      );

      if (workflow.isSystem) {
        return c.json({ error: "Cannot modify system workflows" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId: workflow.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can update transitions" }, 403);
      }

      const updatedTransition = await databases.updateDocument<WorkflowTransition>(
        DATABASE_ID,
        WORKFLOW_TRANSITIONS_ID,
        transitionId,
        updates
      );

      return c.json({ data: updatedTransition });
    }
  )

  // Delete a transition
  .delete("/:workflowId/transitions/:transitionId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workflowId, transitionId } = c.req.param();

    const workflow = await databases.getDocument<Workflow>(
      DATABASE_ID,
      WORKFLOWS_ID,
      workflowId
    );

    if (workflow.isSystem) {
      return c.json({ error: "Cannot modify system workflows" }, 400);
    }

    const member = await getMember({
      databases,
      workspaceId: workflow.workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Only admins can delete transitions" }, 403);
    }

    await databases.deleteDocument(DATABASE_ID, WORKFLOW_TRANSITIONS_ID, transitionId);

    return c.json({ data: { $id: transitionId } });
  })

  // ============ Transition validation ============

  // Validate if a transition is allowed
  .post(
    "/validate-transition",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workflowId: z.string(),
        fromStatusId: z.string(),
        toStatusId: z.string(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workflowId, fromStatusId, toStatusId } = c.req.valid("json");

      const workflow = await databases.getDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId
      );

      const member = await getMember({
        databases,
        workspaceId: workflow.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if transition exists
      const transition = await databases.listDocuments<WorkflowTransition>(
        DATABASE_ID,
        WORKFLOW_TRANSITIONS_ID,
        [
          Query.equal("workflowId", workflowId),
          Query.equal("fromStatusId", fromStatusId),
          Query.equal("toStatusId", toStatusId),
        ]
      );

      if (transition.total === 0) {
        return c.json({
          data: {
            allowed: false,
            reason: "TRANSITION_NOT_ALLOWED",
            message: "This status transition is not allowed in this workflow",
          },
        });
      }

      const transitionDoc = transition.documents[0];

      // Check role restrictions
      if (transitionDoc.allowedRoles && transitionDoc.allowedRoles.length > 0) {
        if (!transitionDoc.allowedRoles.includes(member.role)) {
          return c.json({
            data: {
              allowed: false,
              reason: "ROLE_NOT_ALLOWED",
              message: "Your role does not have permission for this transition",
            },
          });
        }
      }

      return c.json({
        data: {
          allowed: true,
          transition: transitionDoc,
          requiredFields: transitionDoc.requiredFields || [],
        },
      });
    }
  )

  // Get allowed transitions from a status
  .get(
    "/allowed-transitions",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workflowId: z.string(),
        fromStatusId: z.string(),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workflowId, fromStatusId } = c.req.valid("query");

      const workflow = await databases.getDocument<Workflow>(
        DATABASE_ID,
        WORKFLOWS_ID,
        workflowId
      );

      const member = await getMember({
        databases,
        workspaceId: workflow.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get all transitions from this status
      const transitions = await databases.listDocuments<WorkflowTransition>(
        DATABASE_ID,
        WORKFLOW_TRANSITIONS_ID,
        [
          Query.equal("workflowId", workflowId),
          Query.equal("fromStatusId", fromStatusId),
        ]
      );

      // Filter by role if needed
      const allowedTransitions = transitions.documents.filter((t) => {
        if (!t.allowedRoles || t.allowedRoles.length === 0) {
          return true;
        }
        return t.allowedRoles.includes(member.role);
      });

      // Get the target status details
      const targetStatusIds = allowedTransitions.map((t) => t.toStatusId);
      const targetStatuses =
        targetStatusIds.length > 0
          ? await databases.listDocuments<WorkflowStatus>(
              DATABASE_ID,
              WORKFLOW_STATUSES_ID,
              [Query.equal("$id", targetStatusIds)]
            )
          : { documents: [] };

      const statusMap = new Map(
        targetStatuses.documents.map((s) => [s.$id, s])
      );

      const result = allowedTransitions.map((t) => ({
        ...t,
        toStatus: statusMap.get(t.toStatusId),
      }));

      return c.json({ data: result });
    }
  );

export default app;
