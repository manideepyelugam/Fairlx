import { zValidator } from "@hono/zod-validator";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { Hono } from "hono";
import { ID, Query, Models } from "node-appwrite";
import { z } from "zod";

import { getMember } from "@/features/members/utils";
import { seedProjectRolesAndAssignOwner } from "@/features/projects/lib/utils";
import { TaskStatus } from "@/features/tasks/types";
import { WorkflowInheritanceMode, Space } from "@/features/spaces/types";

import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, TASKS_ID, TIME_LOGS_ID, SPACES_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import { createProjectSchema, updateProjectSchema } from "../schemas";
import { Project } from "../types";
import { MemberRole } from "@/features/members/types";
// import { TeamMember } from "@/features/teams/types"; // Legacy Teams Removed

// Parse Appwrite JSON
const transformProject = (project: Models.Document): Project => {
  const raw = project as unknown as Record<string, unknown>;

  return {
    ...(project as unknown as Project),
    customWorkItemTypes: typeof raw.customWorkItemTypes === 'string'
      ? JSON.parse(raw.customWorkItemTypes)
      : (raw.customWorkItemTypes as Project["customWorkItemTypes"]) || [],
    customPriorities: typeof raw.customPriorities === 'string'
      ? JSON.parse(raw.customPriorities)
      : (raw.customPriorities as Project["customPriorities"]) || [],
    customLabels: typeof raw.customLabels === 'string'
      ? JSON.parse(raw.customLabels)
      : (raw.customLabels as Project["customLabels"]) || [],
  };
};

const app = new Hono()
  .post(
    "/",
    sessionMiddleware,
    zValidator("form", createProjectSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { name, description, deadline, image, workspaceId, spaceId } = c.req.valid("form");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer
        ).toString("base64")}`;
      }

      // If project is being created within a space, check for workflow inheritance
      let inheritedWorkflowId: string | null = null;
      let workflowLocked = false;
      
      const normalizedSpaceId = (spaceId === null || spaceId === "" || spaceId === "null" || spaceId === "undefined") ? null : spaceId;
      
      if (normalizedSpaceId) {
        try {
          const space = await databases.getDocument<Space>(
            DATABASE_ID,
            SPACES_ID,
            normalizedSpaceId
          );
          
          // Check if space has a default workflow and inheritance mode
          if (space.defaultWorkflowId) {
            const inheritanceMode = space.workflowInheritance || WorkflowInheritanceMode.SUGGEST;
            
            if (inheritanceMode === WorkflowInheritanceMode.REQUIRE) {
              // Project MUST use space workflow
              inheritedWorkflowId = space.defaultWorkflowId;
              workflowLocked = true;
            } else if (inheritanceMode === WorkflowInheritanceMode.SUGGEST) {
              // Project gets space workflow as default but can override later
              inheritedWorkflowId = space.defaultWorkflowId;
              workflowLocked = false;
            }
            // If NONE, project doesn't inherit workflow
          }
        } catch {
          // Space fetch failed, continue without inheritance
        }
      }

      const project = await databases.createDocument(
        DATABASE_ID,
        PROJECTS_ID,
        ID.unique(),
        {
          name,
          description: description || undefined,
          deadline: deadline || undefined,
          imageUrl: uploadedImageUrl,
          workspaceId,
          spaceId: normalizedSpaceId,
          // Inherit workflow from space if applicable
          ...(inheritedWorkflowId && { workflowId: inheritedWorkflowId }),
          ...(workflowLocked && { workflowLocked: true }),
        }
      );

      // Seed default project roles AND assign creator as Owner
      // This is idempotent and safe to call multiple times
      const seedResult = await seedProjectRolesAndAssignOwner(
        databases,
        project.$id,
        workspaceId,
        user.$id
      );

      // Log seeding result for debugging (non-blocking)
      if (!seedResult.success) {
        console.warn(
          `[ProjectCreate] Role seeding had issues for project ${project.$id}:`,
          {
            rolesCreated: seedResult.rolesCreated,
            rolesFailed: seedResult.rolesFailed,
            ownerMembershipCreated: seedResult.ownerMembershipCreated,
            error: seedResult.error,
          }
        );
      }


      return c.json({ data: transformProject(project) });
    }
  )
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");

      const { workspaceId } = c.req.valid("query");

      if (!workspaceId) {
        return c.json({ error: "Missing workspaceId" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const allProjects = await databases.listDocuments<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        [Query.equal("workspaceId", workspaceId), Query.orderDesc("$createdAt")]
      );

      // If user is admin, return all projects
      if (member.role === MemberRole.ADMIN) {
        return c.json({
          data: {
            ...allProjects,
            documents: allProjects.documents.map(transformProject)
          }
        });
      }

      // Filter projects by team membership (STRICT MODE) -> REMOVED (Legacy Team logic)
      // Now all projects in a workspace are visible to workspace members (or filter by new project members if needed)
      // For now, returning all projects in workspace for members

      return c.json({
        data: {
          ...allProjects,
          documents: allProjects.documents.map(transformProject)
        }
      });
    }
  )
  .get("/:projectId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { projectId } = c.req.param();

    const project = await databases.getDocument<Project>(
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

    // Project permission check: verify user can view this project
    const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
    const access = await resolveUserProjectAccess(databases, user.$id, projectId);
    if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.VIEW_PROJECT)) {
      return c.json({ error: "Forbidden: No permission to view this project" }, 403);
    }

    return c.json({ data: transformProject(project) });
  })
  .patch(
    "/:projectId",
    sessionMiddleware,
    zValidator("form", updateProjectSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { projectId } = c.req.param();
      const {
        name,
        description,
        deadline,
        image,
        spaceId,
        workflowId,
        customWorkItemTypes,
        customPriorities,
        customLabels
      } = c.req.valid("form");

      const existingProject = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      );

      const member = await getMember({
        databases,
        workspaceId: existingProject.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Project permission check: verify user can edit project settings
      const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
      const accessForEdit = await resolveUserProjectAccess(databases, user.$id, projectId);
      if (!accessForEdit.hasAccess || !hasProjectPermission(accessForEdit, ProjectPermissionKey.EDIT_SETTINGS)) {
        return c.json({ error: "Forbidden: No permission to edit project settings" }, 403);
      }

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer
        ).toString("base64")}`;
      } else {
        uploadedImageUrl = image;
      }

      const updateData: Record<string, unknown> = {
        name,
        imageUrl: uploadedImageUrl,
        lastModifiedBy: user.$id,
      };

      // Update fields if provided
      if (description !== undefined) {
        updateData.description = description || null;
      }

      // Only update deadline if it was provided (null to clear it)
      if (deadline !== undefined) {
        updateData.deadline = deadline || null;
      }

      // Normalise space/workflow IDs (handle null, empty, "null", "undefined" strings)
      if (spaceId !== undefined) {
        updateData.spaceId = (spaceId === null || spaceId === "" || spaceId === "null" || spaceId === "undefined") ? null : spaceId;
      }

      if (workflowId !== undefined) {
        updateData.workflowId = (workflowId === null || workflowId === "" || workflowId === "null") ? null : workflowId;
      }

      // Update custom definitions
      if (customWorkItemTypes !== undefined) {
        updateData.customWorkItemTypes = JSON.stringify(customWorkItemTypes);
      }
      if (customPriorities !== undefined) {
        updateData.customPriorities = JSON.stringify(customPriorities);
      }
      if (customLabels !== undefined) {
        updateData.customLabels = JSON.stringify(customLabels);
      }

      const project = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
        updateData
      );

      return c.json({ data: transformProject(project) });
    }
  )
  .delete("/:projectId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { projectId } = c.req.param();

    const existingProject = await databases.getDocument<Project>(
      DATABASE_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Project permission check: verify user can delete this project
    const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
    const access = await resolveUserProjectAccess(databases, user.$id, projectId);
    if (!access.hasAccess || !hasProjectPermission(access, ProjectPermissionKey.DELETE_PROJECT)) {
      return c.json({ error: "Forbidden: No permission to delete this project" }, 403);
    }

    // Cascade delete related data
    try {
      // Get all tasks for this project
      const tasks = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [Query.equal("projectId", projectId)]
      );

      // Get all time logs for this project
      const timeLogs = await databases.listDocuments(
        DATABASE_ID,
        TIME_LOGS_ID,
        [Query.equal("projectId", projectId)]
      );

      // Legacy Team check removed/ Delete all time logs for this project
      for (const timeLog of timeLogs.documents) {
        await databases.deleteDocument(DATABASE_ID, TIME_LOGS_ID, timeLog.$id);
      }

      // Delete all tasks for this project
      for (const task of tasks.documents) {
        await databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id);
      }

      // Finally delete the project
      await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

      return c.json({ data: { $id: existingProject.$id } });
    } catch {
      return c.json({ error: "Failed to delete project and related data" }, 500);
    }
  })
  .get("/:projectId/analytics", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const { projectId } = c.req.param();

    const project = await databases.getDocument<Project>(
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

    // Project permission check: verify user can view this project for analytics
    const { resolveUserProjectAccess, hasProjectPermission, ProjectPermissionKey } = await import("@/lib/permissions/resolveUserProjectAccess");
    const accessForAnalytics = await resolveUserProjectAccess(databases, user.$id, projectId);
    if (!accessForAnalytics.hasAccess || !hasProjectPermission(accessForAnalytics, ProjectPermissionKey.VIEW_PROJECT)) {
      return c.json({ error: "Forbidden: No permission to view this project's analytics" }, 403);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
    );

    const taskCount = thisMonthTasks.total;
    const taskDifference = taskCount - lastMonthTasks.total;

    const thisMonthAssignedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.contains("assigneeIds", member.$id),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthAssignedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.contains("assigneeIds", member.$id),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
    );

    const assignedTaskCount = thisMonthAssignedTasks.total;
    const assignedTaskDifference =
      assignedTaskCount - lastMonthAssignedTasks.total;

    const thisMonthIncompleteTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthIncompleteTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
    );

    const incompleteTaskCount = thisMonthIncompleteTasks.total;
    const incompleteTaskDifference =
      incompleteTaskCount - lastMonthIncompleteTasks.total;

    const thisMonthCompletedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.equal("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthCompletedTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.equal("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
    );

    const completedTaskCount = thisMonthCompletedTasks.total;
    const completedTaskDifference =
      completedTaskCount - lastMonthCompletedTasks.total;

    const thisMonthOverdueTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.lessThan("dueDate", now.toISOString()),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthOverdueTasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.lessThan("dueDate", now.toISOString()),
        Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
      ]
    );

    const overdueTaskCount = thisMonthOverdueTasks.total;
    const overdueTaskDifference =
      overdueTaskCount - lastMonthOverdueTasks.total;

    return c.json({
      data: {
        taskCount,
        taskDifference,
        assignedTaskCount,
        assignedTaskDifference,
        completedTaskCount,
        completedTaskDifference,
        incompleteTaskCount,
        incompleteTaskDifference,
        overdueTaskCount,
        overdueTaskDifference,
      },
    });
  })
  .post(
    "/:projectId/teams/:teamId",
    sessionMiddleware,
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { projectId, teamId } = c.req.param();

      try {
        // Get project
        const project = await databases.getDocument<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          projectId
        );

        if (!project) {
          return c.json({ error: "Project not found" }, 404);
        }

        // Verify admin access or team lead access
        const member = await getMember({
          databases,
          workspaceId: project.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "Unauthorized - Not a workspace member" }, 403);
        }

        // Check if user is admin OR team lead of the team being assigned
        const isAdmin = member.role === MemberRole.ADMIN;

        // Check if user is team lead of this team
        let isTeamLead = false;
        if (!isAdmin) {
          const { PROJECT_TEAM_MEMBERS_ID } = await import("@/config");
          const { Query } = await import("node-appwrite");
          const teamMembers = await databases.listDocuments(
            DATABASE_ID,
            PROJECT_TEAM_MEMBERS_ID,
            [
              Query.equal("teamId", teamId),
              Query.equal("userId", user.$id), // Changed from memberId to userId as project teams link to users
              Query.equal("role", "LEAD"),
              Query.equal("isActive", true),
            ]
          );
          isTeamLead = teamMembers.total > 0;
        }

        if (!isAdmin && !isTeamLead) {
          return c.json({ error: "Only workspace admins or team leads can assign projects to teams" }, 403);
        }

        // Assign team
        const currentTeamIds = project.assignedTeamIds || [];
        if (!currentTeamIds.includes(teamId)) {
          currentTeamIds.push(teamId);
        }

        const updatedProject = await databases.updateDocument(
          DATABASE_ID,
          PROJECTS_ID,
          projectId,
          {
            assignedTeamIds: currentTeamIds,
          }
        );

        return c.json({ data: transformProject(updatedProject) });
      } catch (error) {
        return c.json({
          error: "Failed to assign project to team",
          details: error instanceof Error ? error.message : String(error)
        }, 400);
      }
    }
  )
  .delete(
    "/:projectId/teams/:teamId",
    sessionMiddleware,
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { projectId, teamId } = c.req.param();

      try {
        // Get the project
        const project = await databases.getDocument<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          projectId
        );

        if (!project) {
          return c.json({ error: "Project not found" }, 404);
        }

        // Check if user is workspace member
        const member = await getMember({
          databases,
          workspaceId: project.workspaceId,
          userId: user.$id,
        });

        if (!member) {
          return c.json({ error: "Unauthorized - Not a workspace member" }, 403);
        }

        // Check if user is admin OR team lead of the team being unassigned
        const isAdmin = member.role === MemberRole.ADMIN;

        // Check if user is team lead of this team
        let isTeamLead = false;
        if (!isAdmin) {
          const { PROJECT_TEAM_MEMBERS_ID } = await import("@/config");
          const { Query } = await import("node-appwrite");
          const teamMembers = await databases.listDocuments(
            DATABASE_ID,
            PROJECT_TEAM_MEMBERS_ID,
            [
              Query.equal("teamId", teamId),
              Query.equal("userId", user.$id), // Changed memberId to userId
              Query.equal("role", "LEAD"),
              Query.equal("isActive", true),
            ]
          );
          isTeamLead = teamMembers.total > 0;
        }

        if (!isAdmin && !isTeamLead) {
          return c.json({ error: "Only workspace admins or team leads can unassign projects from teams" }, 403);
        }

        // Unassign team
        const currentTeamIds = project.assignedTeamIds || [];
        const updatedTeamIds = currentTeamIds.filter((id) => id !== teamId);

        const updatedProject = await databases.updateDocument(
          DATABASE_ID,
          PROJECTS_ID,
          projectId,
          {
            assignedTeamIds: updatedTeamIds,
          }
        );

        return c.json({ data: transformProject(updatedProject) });
      } catch (error) {
        return c.json({
          error: "Failed to unassign project from team",
          details: error instanceof Error ? error.message : String(error)
        }, 400);
      }
    }
  )
  .post(
    "/:projectId/copy-settings",
    sessionMiddleware,
    zValidator("json", z.object({ sourceProjectId: z.string() })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { projectId } = c.req.param();
      const { sourceProjectId } = c.req.valid("json");

      const targetProject = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
      );

      const member = await getMember({
        databases,
        workspaceId: targetProject.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only admins can update project settings" }, 403);
      }

      const sourceProject = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        sourceProjectId
      );

      if (!sourceProject) {
        return c.json({ error: "Source project not found" }, 404);
      }

      // Verify workspace match
      if (sourceProject.workspaceId !== targetProject.workspaceId) {
        return c.json({ error: "Cannot copy from project in different workspace" }, 400);
      }

      // Copy settings
      const updateData: Record<string, unknown> = {};
      const transformedSourceProject = transformProject(sourceProject);

      if (transformedSourceProject.customWorkItemTypes) {
        updateData.customWorkItemTypes = JSON.stringify(transformedSourceProject.customWorkItemTypes);
      }
      if (transformedSourceProject.customPriorities) {
        updateData.customPriorities = JSON.stringify(transformedSourceProject.customPriorities);
      }
      if (transformedSourceProject.customLabels) {
        updateData.customLabels = JSON.stringify(transformedSourceProject.customLabels);
      }

      const updatedProject = await databases.updateDocument(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
        updateData
      );

      return c.json({ data: transformProject(updatedProject) });
    }
  );

export default app;
