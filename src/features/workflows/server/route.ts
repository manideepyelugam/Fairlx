import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query, type Databases, Models } from "node-appwrite";
import { z } from "zod";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { SpaceRole, SpaceMember } from "@/features/spaces/types";

import {
  DATABASE_ID,
  WORKFLOWS_ID,
  WORKFLOW_STATUSES_ID,
  WORKFLOW_TRANSITIONS_ID,
  PROJECTS_ID,
  TEAM_MEMBERS_ID,
  SPACE_MEMBERS_ID,
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
  StatusType,
} from "../types";

/**
 * Helper function to check if user has permission to manage workflows
 * Permissions:
 * - Workspace OWNER or ADMIN can manage all workflows
 * - Space ADMIN (Master) can manage workflows in their space
 */
async function checkWorkflowPermission(
  databases: Databases,
  workspaceId: string,
  userId: string,
  spaceId?: string | null
): Promise<{ hasPermission: boolean; member: { role?: string } | null }> {
  const member = (await getMember({
    databases,
    workspaceId,
    userId,
  })) as { role?: string } | undefined;

  if (!member) {
    return { hasPermission: false, member: null };
  }

  // Workspace OWNER or ADMIN can always manage workflows
  if (member.role === MemberRole.OWNER || member.role === MemberRole.ADMIN) {
    return { hasPermission: true, member };
  }

  // If it's a space-level workflow, check if user is Space Master
  if (spaceId) {
    const spaceMembership = await databases.listDocuments<SpaceMember>(
      DATABASE_ID,
      SPACE_MEMBERS_ID,
      [
        Query.equal("spaceId", spaceId),
        Query.equal("userId", userId),
      ]
    );

    if (spaceMembership.total > 0 && spaceMembership.documents[0].role === SpaceRole.ADMIN) {
      return { hasPermission: true, member };
    }
  }

  return { hasPermission: false, member };
}

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
        isDefault,
        copyFromWorkflowId,
      } = c.req.valid("json");

      const { hasPermission } = await checkWorkflowPermission(
        databases,
        workspaceId,
        user.$id,
        spaceId
      );

      if (!hasPermission) {
        return c.json(
          { error: "Only workspace owners, admins, or space masters can create workflows" },
          403
        );
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
          isDefault: isDefault || false,
          isArchived: false,
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
              icon: status.icon,
              color: status.color,
              statusType: status.statusType,
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
                allowedTeamIds: transition.allowedTeamIds,
                allowedMemberRoles: transition.allowedMemberRoles,
                requiresApproval: transition.requiresApproval,
                approverTeamIds: transition.approverTeamIds,
              }
            );
          }
        }
      } else {
        // Create default statuses from template (Software Development - simple linear flow)
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
              icon: statusDef.icon,
              color: statusDef.color,
              statusType: statusDef.statusType,
              position: statusDef.position,
              positionX: statusDef.positionX || (statusDef.position * 250),
              positionY: statusDef.positionY || 100,
              isInitial: statusDef.isInitial,
              isFinal: statusDef.isFinal,
            }
          );
          statusIdMap[statusDef.key] = status.$id;
        }

        // ALWAYS create simple transitions from template (never use "ALL")
        // Software Development template has proper defined transitions
        if (Array.isArray(template.transitions)) {
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
                  name: transitionDef.name || null,
                  allowedTeamIds: transitionDef.allowedTeamIds || null,
                  requiresApproval: transitionDef.requiresApproval || false,
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

      const { hasPermission } = await checkWorkflowPermission(
        databases,
        workflow.workspaceId,
        user.$id,
        workflow.spaceId
      );

      if (!hasPermission) {
        return c.json({ error: "Only workspace owners, admins, or space masters can update workflows" }, 403);
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

    const { hasPermission } = await checkWorkflowPermission(
      databases,
      workflow.workspaceId,
      user.$id,
      workflow.spaceId
    );

    if (!hasPermission) {
      return c.json({ error: "Only workspace owners, admins, or space masters can delete workflows" }, 403);
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

      const { hasPermission } = await checkWorkflowPermission(
        databases,
        workflow.workspaceId,
        user.$id,
        workflow.spaceId
      );

      if (!hasPermission) {
        return c.json({ error: "Only workspace owners, admins, or space masters can add statuses" }, 403);
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
          icon: statusData.icon || "Circle",
          color: statusData.color,
          statusType: statusData.statusType || StatusType.OPEN,
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

      const { hasPermission } = await checkWorkflowPermission(
        databases,
        workflow.workspaceId,
        user.$id,
        workflow.spaceId
      );

      if (!hasPermission) {
        return c.json({ error: "Only workspace owners, admins, or space masters can update statuses" }, 403);
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

    const { hasPermission } = await checkWorkflowPermission(
      databases,
      workflow.workspaceId,
      user.$id,
      workflow.spaceId
    );

    if (!hasPermission) {
      return c.json({ error: "Only workspace owners, admins, or space masters can delete statuses" }, 403);
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

      const { hasPermission } = await checkWorkflowPermission(
        databases,
        workflow.workspaceId,
        user.$id,
        workflow.spaceId
      );

      if (!hasPermission) {
        return c.json({ error: "Only workspace owners, admins, or space masters can add transitions" }, 403);
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
          allowedTeamIds: transitionData.allowedTeamIds || null,
          allowedMemberRoles: transitionData.allowedMemberRoles || null,
          requiresApproval: transitionData.requiresApproval || false,
          approverTeamIds: transitionData.approverTeamIds || null,
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

      const { hasPermission } = await checkWorkflowPermission(
        databases,
        workflow.workspaceId,
        user.$id,
        workflow.spaceId
      );

      if (!hasPermission) {
        return c.json({ error: "Only workspace owners, admins, or space masters can update transitions" }, 403);
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

    const { hasPermission } = await checkWorkflowPermission(
      databases,
      workflow.workspaceId,
      user.$id,
      workflow.spaceId
    );

    if (!hasPermission) {
      return c.json({ error: "Only workspace owners, admins, or space masters can delete transitions" }, 403);
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

      // Check role restrictions (using new allowedMemberRoles)
      if (transitionDoc.allowedMemberRoles && transitionDoc.allowedMemberRoles.length > 0) {
        if (!transitionDoc.allowedMemberRoles.includes(member.role)) {
          return c.json({
            data: {
              allowed: false,
              reason: "ROLE_NOT_ALLOWED",
              message: "Your role does not have permission for this transition",
            },
          });
        }
      }

      // Check team restrictions
      if (transitionDoc.allowedTeamIds && transitionDoc.allowedTeamIds.length > 0) {
        // Get user's team memberships
        const userTeamMemberships = await databases.listDocuments(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          [Query.equal("userId", user.$id), Query.equal("workspaceId", workflow.workspaceId)]
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userTeamIds = userTeamMemberships.documents.map((m) => (m as any).teamId);
        const hasAllowedTeam = transitionDoc.allowedTeamIds.some((teamId: string) => 
          userTeamIds.includes(teamId)
        );
        
        if (!hasAllowedTeam) {
          return c.json({
            data: {
              allowed: false,
              reason: "TEAM_NOT_ALLOWED",
              message: "Your team does not have permission for this transition",
            },
          });
        }
      }

      // Check if requires approval
      if (transitionDoc.requiresApproval) {
        // Check if user is in an approver team
        const userTeamMemberships = await databases.listDocuments(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          [Query.equal("userId", user.$id), Query.equal("workspaceId", workflow.workspaceId)]
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userTeamIds = userTeamMemberships.documents.map((m) => (m as any).teamId);
        const isApprover = transitionDoc.approverTeamIds?.some((teamId: string) => 
          userTeamIds.includes(teamId)
        );
        
        if (!isApprover) {
          return c.json({
            data: {
              allowed: false,
              reason: "REQUIRES_APPROVAL",
              message: "This transition requires approval from designated teams",
              approverTeamIds: transitionDoc.approverTeamIds,
            },
          });
        }
      }

      return c.json({
        data: {
          allowed: true,
          transition: transitionDoc,
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

      // Get user's team memberships for filtering
      const userTeamMemberships = await databases.listDocuments(
        DATABASE_ID,
        TEAM_MEMBERS_ID,
        [Query.equal("userId", user.$id), Query.equal("workspaceId", workflow.workspaceId)]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userTeamIds = userTeamMemberships.documents.map((m) => (m as any).teamId);

      // Filter transitions based on role and team restrictions
      const allowedTransitions = transitions.documents.filter((t) => {
        // Check role restrictions
        if (t.allowedMemberRoles && t.allowedMemberRoles.length > 0) {
          if (!t.allowedMemberRoles.includes(member.role)) {
            return false;
          }
        }
        
        // Check team restrictions
        if (t.allowedTeamIds && t.allowedTeamIds.length > 0) {
          const hasAllowedTeam = t.allowedTeamIds.some((teamId: string) => 
            userTeamIds.includes(teamId)
          );
          if (!hasAllowedTeam) {
            return false;
          }
        }
        
        return true;
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
        requiresApproval: t.requiresApproval || false,
      }));

      return c.json({ data: result });
    }
  )

  // ============ Connect project to workflow ============
  .post(
    "/:workflowId/connect-project/:projectId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId, projectId } = c.req.param();

      // Get the workflow
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

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can connect projects to workflows" }, 403);
      }

      // Get the project
      const project = await databases.getDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      );

      if (project.workspaceId !== workflow.workspaceId) {
        return c.json({ error: "Project and workflow must be in the same workspace" }, 400);
      }

      // Update the project to use this workflow
      const updatedProject = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
        {
          workflowId: workflowId,
        }
      );

      return c.json({
        data: {
          project: updatedProject,
          workflow: workflow,
        },
      });
    }
  )

  // ============ Sync workflow and project statuses with conflict resolution ============
  .post(
    "/:workflowId/sync-with-resolution/:projectId",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        resolution: z.enum(["workflow", "project"]),
      })
    ),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId, projectId } = c.req.param();
      const { resolution } = c.req.valid("json");

      // Get the workflow with statuses
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

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can sync workflow and project" }, 403);
      }

      // Get workflow statuses
      const workflowStatuses = await databases.listDocuments<WorkflowStatus>(
        DATABASE_ID,
        WORKFLOW_STATUSES_ID,
        [Query.equal("workflowId", workflowId), Query.orderAsc("position")]
      );

      // Get the project
      const project = await databases.getDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      );

      if (project.workspaceId !== workflow.workspaceId) {
        return c.json({ error: "Project and workflow must be in the same workspace" }, 400);
      }

      const projectCustomTypes = (project.customWorkItemTypes || []) as Array<{
        key: string;
        label: string;
        icon: string;
        color: string;
      }>;

      if (resolution === "workflow") {
        // Workflow takes priority
        // Update project's customWorkItemTypes to match workflow statuses
        // Statuses on canvas (with positions) become visible columns
        // Statuses not on canvas (position 0,0) become hidden
        
        const newCustomTypes = workflowStatuses.documents.map((status) => {
          // Check if this status has a canvas position (visible)
          const hasCanvasPosition = 
            (status.positionX !== undefined && status.positionX > 0) || 
            (status.positionY !== undefined && status.positionY > 0);
          
          return {
            key: status.key,
            label: status.name,
            icon: status.icon,
            color: status.color,
            // Add visibility flag based on canvas position
            visible: hasCanvasPosition,
          };
        });

        await databases.updateDocument(
          DATABASE_ID,
          PROJECTS_ID,
          projectId,
          {
            workflowId: workflowId,
            customWorkItemTypes: newCustomTypes,
          }
        );

        return c.json({
          data: {
            message: "Project synced to workflow statuses",
            resolution: "workflow",
            statusCount: newCustomTypes.length,
          },
        });
      } else {
        // Project takes priority
        // Add missing project statuses to workflow
        const workflowStatusKeys = new Set(
          workflowStatuses.documents.map((s) => s.key)
        );

        // Find project statuses not in workflow
        const missingInWorkflow = projectCustomTypes.filter(
          (t) => !workflowStatusKeys.has(t.key)
        );

        // Add missing statuses to workflow
        let position = workflowStatuses.total;
        for (const missingStatus of missingInWorkflow) {
          await databases.createDocument<WorkflowStatus>(
            DATABASE_ID,
            WORKFLOW_STATUSES_ID,
            ID.unique(),
            {
              workflowId,
              name: missingStatus.label,
              key: missingStatus.key,
              icon: missingStatus.icon || "Circle",
              color: missingStatus.color || "#6B7280",
              statusType: StatusType.OPEN, // Default to OPEN for new statuses
              description: null,
              position: position++,
              positionX: 0, // Not on canvas initially
              positionY: 0,
              isInitial: false,
              isFinal: false,
            }
          );
        }

        // Update project to use this workflow
        await databases.updateDocument(
          DATABASE_ID,
          PROJECTS_ID,
          projectId,
          {
            workflowId: workflowId,
          }
        );

        return c.json({
          data: {
            message: "Workflow synced from project statuses",
            resolution: "project",
            addedStatuses: missingInWorkflow.length,
          },
        });
      }
    }
  )

  // ============ Disconnect project from workflow ============
  .post(
    "/:workflowId/disconnect-project/:projectId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { workflowId, projectId } = c.req.param();

      // Get the workflow
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

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can disconnect projects from workflows" }, 403);
      }

      // Update the project to remove workflow connection
      const updatedProject = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
        {
          workflowId: null,
        }
      );

      return c.json({
        data: {
          project: updatedProject,
        },
      });
    }
  )

  // ============ Get workflow statuses for a project ============
  .get(
    "/project/:projectId/statuses",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { projectId } = c.req.param();

      // Get the project
      const project = await databases.getDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      );

      const member = await getMember({
        databases,
        workspaceId: project.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // If project has a workflow, get its statuses
      if (project.workflowId) {
        const statuses = await databases.listDocuments<WorkflowStatus>(
          DATABASE_ID,
          WORKFLOW_STATUSES_ID,
          [Query.equal("workflowId", project.workflowId), Query.orderAsc("position")]
        );

        return c.json({ 
          data: { 
            statuses: statuses.documents,
            workflowId: project.workflowId,
          } 
        });
      }

      // No workflow connected - return default statuses
      const defaultStatuses = [
        { $id: "TODO", name: "To Do", key: "TODO", icon: "Circle", color: "#6B7280", statusType: StatusType.OPEN, position: 0, isInitial: true, isFinal: false },
        { $id: "ASSIGNED", name: "Assigned", key: "ASSIGNED", icon: "UserCheck", color: "#F59E0B", statusType: StatusType.OPEN, position: 1, isInitial: false, isFinal: false },
        { $id: "IN_PROGRESS", name: "In Progress", key: "IN_PROGRESS", icon: "Clock", color: "#3B82F6", statusType: StatusType.IN_PROGRESS, position: 2, isInitial: false, isFinal: false },
        { $id: "IN_REVIEW", name: "In Review", key: "IN_REVIEW", icon: "Eye", color: "#8B5CF6", statusType: StatusType.IN_PROGRESS, position: 3, isInitial: false, isFinal: false },
        { $id: "DONE", name: "Done", key: "DONE", icon: "CheckCircle", color: "#10B981", statusType: StatusType.CLOSED, position: 4, isInitial: false, isFinal: true },
      ];

      return c.json({ 
        data: { 
          statuses: defaultStatuses,
          workflowId: null,
        } 
      });
    }
  );

export default app;