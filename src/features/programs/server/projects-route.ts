import { Hono } from "hono";
import { Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, PROGRAMS_ID, PROGRAM_MEMBERS_ID, PROJECTS_ID, TASKS_ID } from "@/config";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { 
  Program, 
  ProgramMember, 
  ProgramMemberRole,
  LinkedProject
} from "../types";
import { programSchemas } from "../schemas";

/**
 * Check if user can manage program projects
 * Must be program LEAD or ADMIN, or workspace ADMIN
 */
async function canManageProgramProjects(
  databases: Parameters<typeof getMember>[0]["databases"],
  programId: string,
  userId: string
): Promise<{ allowed: boolean; program?: Program }> {
  try {
    const program = await databases.getDocument<Program>(
      DATABASE_ID,
      PROGRAMS_ID,
      programId
    );

    // Check workspace membership
    const workspaceMember = await getMember({
      databases,
      workspaceId: program.workspaceId,
      userId,
    });

    if (!workspaceMember) {
      return { allowed: false };
    }

    // Workspace admins can always manage
    if (workspaceMember.role === MemberRole.ADMIN) {
      return { allowed: true, program };
    }

    // Check program membership
    const programMembers = await databases.listDocuments<ProgramMember>(
      DATABASE_ID,
      PROGRAM_MEMBERS_ID,
      [
        Query.equal("programId", programId),
        Query.equal("userId", userId),
      ]
    );

    if (programMembers.total === 0) {
      return { allowed: false, program };
    }

    const programMember = programMembers.documents[0];
    const canManage = [ProgramMemberRole.LEAD, ProgramMemberRole.ADMIN].includes(
      programMember.role as ProgramMemberRole
    );

    return { allowed: canManage, program };
  } catch {
    return { allowed: false };
  }
}

/**
 * Check if user is a member of the program (any role)
 */
async function isProgramMember(
  databases: Parameters<typeof getMember>[0]["databases"],
  programId: string,
  userId: string
): Promise<boolean> {
  try {
    const program = await databases.getDocument<Program>(
      DATABASE_ID,
      PROGRAMS_ID,
      programId
    );

    // Check workspace membership first
    const workspaceMember = await getMember({
      databases,
      workspaceId: program.workspaceId,
      userId,
    });

    if (!workspaceMember) {
      return false;
    }

    // Workspace admins have access to all programs
    if (workspaceMember.role === MemberRole.ADMIN) {
      return true;
    }

    // Check program membership
    const programMembers = await databases.listDocuments<ProgramMember>(
      DATABASE_ID,
      PROGRAM_MEMBERS_ID,
      [
        Query.equal("programId", programId),
        Query.equal("userId", userId),
      ]
    );

    return programMembers.total > 0;
  } catch {
    return false;
  }
}

const app = new Hono()
  // ========================================
  // GET /api/programs/:programId/projects - List projects in program
  // ========================================
  .get(
    "/",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;

      if (!programId) {
        return c.json({ error: "Program ID is required" }, 400);
      }

      // Verify user has access to this program
      const hasAccess = await isProgramMember(databases, programId, user.$id);
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get all projects linked to this program
      const projects = await databases.listDocuments<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        [
          Query.equal("programId", programId),
          Query.orderDesc("$createdAt"),
        ]
      );

      // Calculate task counts for each project
      const linkedProjects: LinkedProject[] = await Promise.all(
        projects.documents.map(async (project) => {
          try {
            // Get total task count
            const allTasks = await databases.listDocuments(
              DATABASE_ID,
              TASKS_ID,
              [
                Query.equal("projectId", project.$id),
                Query.limit(1), // We only need the count
              ]
            );

            // Get completed task count
            const completedTasks = await databases.listDocuments(
              DATABASE_ID,
              TASKS_ID,
              [
                Query.equal("projectId", project.$id),
                Query.equal("status", "DONE"),
                Query.limit(1),
              ]
            );

            const taskCount = allTasks.total;
            const completedTaskCount = completedTasks.total;
            const progress = taskCount > 0 
              ? Math.round((completedTaskCount / taskCount) * 100) 
              : 0;

            return {
              $id: project.$id,
              name: project.name,
              key: project.key || "",
              status: project.status || "ACTIVE",
              imageUrl: project.imageUrl,
              taskCount,
              completedTaskCount,
              progress,
            };
          } catch {
            return {
              $id: project.$id,
              name: project.name,
              key: project.key || "",
              status: project.status || "ACTIVE",
              imageUrl: project.imageUrl,
              taskCount: 0,
              completedTaskCount: 0,
              progress: 0,
            };
          }
        })
      );

      return c.json({ 
        data: { 
          documents: linkedProjects, 
          total: projects.total 
        } 
      });
    }
  )

  // ========================================
  // POST /api/programs/:programId/projects - Link project to program
  // ========================================
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", programSchemas.linkProject),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const { projectId } = c.req.valid("json");

      if (!programId) {
        return c.json({ error: "Program ID is required" }, 400);
      }

      // Verify user can manage program projects
      const { allowed, program } = await canManageProgramProjects(
        databases,
        programId,
        user.$id
      );

      if (!allowed || !program) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can link projects." },
          403
        );
      }

      try {
        // Get the project to verify it exists and belongs to same workspace
        const project = await databases.getDocument<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          projectId
        );

        // Verify project is in same workspace
        if (project.workspaceId !== program.workspaceId) {
          return c.json(
            { error: "Project must be in the same workspace as the program" },
            400
          );
        }

        // Check if project is already linked to another program
        if (project.programId && project.programId !== programId) {
          // Get the other program name for error message
          try {
            const otherProgram = await databases.getDocument<Program>(
              DATABASE_ID,
              PROGRAMS_ID,
              project.programId
            );
            return c.json(
              { error: `Project is already linked to program "${otherProgram.name}"` },
              409
            );
          } catch {
            return c.json({ error: "Project is already linked to another program" }, 409);
          }
        }

        // Check if project is already linked to this program
        if (project.programId === programId) {
          return c.json({ error: "Project is already linked to this program" }, 409);
        }

        // Link the project to the program
        const updatedProject = await databases.updateDocument<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          projectId,
          { programId }
        );

        return c.json({ 
          data: { 
            projectId: updatedProject.$id, 
            programId,
            name: updatedProject.name
          } 
        }, 201);
      } catch {
        return c.json({ error: "Project not found" }, 404);
      }
    }
  )

  // ========================================
  // DELETE /api/programs/:programId/projects/:projectId - Unlink project from program
  // ========================================
  .delete(
    "/:projectId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const projectId = c.req.param("projectId") as string;

      if (!programId || !projectId) {
        return c.json({ error: "Program ID and Project ID are required" }, 400);
      }

      // Verify user can manage program projects
      const { allowed } = await canManageProgramProjects(
        databases,
        programId,
        user.$id
      );

      if (!allowed) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can unlink projects." },
          403
        );
      }

      try {
        // Get the project to verify it's linked to this program
        const project = await databases.getDocument<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          projectId
        );

        if (project.programId !== programId) {
          return c.json({ error: "Project is not linked to this program" }, 400);
        }

        // Unlink the project from the program
        await databases.updateDocument<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          projectId,
          { programId: null }
        );

        return c.json({ data: { projectId } });
      } catch {
        return c.json({ error: "Project not found" }, 404);
      }
    }
  )

  // ========================================
  // GET /api/programs/:programId/projects/available - Get projects available to link
  // ========================================
  .get(
    "/available",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;

      if (!programId) {
        return c.json({ error: "Program ID is required" }, 400);
      }

      // Verify user can manage program projects
      const { allowed, program } = await canManageProgramProjects(
        databases,
        programId,
        user.$id
      );

      if (!allowed || !program) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      // Get all projects in the workspace that are not linked to any program
      // or are linked to this program
      const projects = await databases.listDocuments<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        [
          Query.equal("workspaceId", program.workspaceId),
          Query.orderAsc("name"),
        ]
      );

      // Filter to projects not linked to any program
      const availableProjects = projects.documents.filter(
        (p) => !p.programId || p.programId === programId
      );

      return c.json({
        data: {
          documents: availableProjects.map((p) => ({
            $id: p.$id,
            name: p.name,
            key: p.key || "",
            imageUrl: p.imageUrl,
            isLinked: p.programId === programId,
          })),
          total: availableProjects.length,
        },
      });
    }
  );

export default app;
