import { Hono } from "hono";
import { Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { 
  DATABASE_ID, 
  PROGRAMS_ID, 
  PROGRAM_MEMBERS_ID, 
  PROGRAM_MILESTONES_ID,
  PROJECTS_ID,
  TASKS_ID 
} from "@/config";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { 
  Program, 
  ProgramMember, 
  ProgramMilestone,
  ProgramAnalytics,
  MilestoneStatus
} from "../types";
import { programSchemas } from "../schemas";
import type { Models } from "node-appwrite";

// Task type (from tasks feature) - extends Document
type Task = Models.Document & {
  status: string;
  dueDate?: string | null;
  projectId: string;
};

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
  // GET /api/programs/:programId/analytics - Get program analytics
  // ========================================
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", programSchemas.getProgramAnalytics.omit({ programId: true })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      // const { dateRange } = c.req.valid("query"); // For future date filtering

      if (!programId) {
        return c.json({ error: "Program ID is required" }, 400);
      }

      // Verify user has access to this program
      const hasAccess = await isProgramMember(databases, programId, user.$id);
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        // Get program
        const program = await databases.getDocument<Program>(
          DATABASE_ID,
          PROGRAMS_ID,
          programId
        );

        // Get linked projects
        const projects = await databases.listDocuments<Project>(
          DATABASE_ID,
          PROJECTS_ID,
          [Query.equal("programId", programId)]
        );

        const projectIds = projects.documents.map((p) => p.$id);

        // Get program members
        const members = await databases.listDocuments<ProgramMember>(
          DATABASE_ID,
          PROGRAM_MEMBERS_ID,
          [Query.equal("programId", programId)]
        );

        // Get milestones
        const milestones = await databases.listDocuments<ProgramMilestone>(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          [Query.equal("programId", programId)]
        );

        // Task statistics
        let totalTasks = 0;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let blockedTasks = 0;
        let overdueTasks = 0;

        // Calculate project statistics
        let activeProjects = 0;
        let completedProjects = 0;

        const now = new Date();

        if (projectIds.length > 0) {
          // Get all tasks for linked projects
          // Note: Appwrite has limitations on query complexity, so we fetch in batches if needed
          for (const projectId of projectIds) {
            // Get project status counts
            const project = projects.documents.find((p) => p.$id === projectId);
            if (project) {
              if (project.status === "COMPLETED" || project.status === "ARCHIVED") {
                completedProjects++;
              } else if (project.status === "ACTIVE") {
                activeProjects++;
              }
            }

            // Get tasks for this project
            const projectTasks = await databases.listDocuments<Task>(
              DATABASE_ID,
              TASKS_ID,
              [
                Query.equal("projectId", projectId),
                Query.limit(1000), // Get up to 1000 tasks per project
              ]
            );

            totalTasks += projectTasks.total;

            for (const task of projectTasks.documents) {
              switch (task.status) {
                case "DONE":
                case "CLOSED":
                  completedTasks++;
                  break;
                case "IN_PROGRESS":
                case "IN_REVIEW":
                  inProgressTasks++;
                  break;
                case "BLOCKED":
                  blockedTasks++;
                  break;
                default:
                  // BACKLOG, TODO, etc.
                  break;
              }

              // Check for overdue tasks
              if (task.dueDate && task.status !== "DONE" && task.status !== "CLOSED") {
                const dueDate = new Date(task.dueDate);
                if (dueDate < now) {
                  overdueTasks++;
                }
              }
            }
          }
        }

        // Calculate milestone statistics
        const completedMilestones = milestones.documents.filter(
          (m) => m.status === MilestoneStatus.COMPLETED
        ).length;

        // Calculate overall progress
        let overallProgress = 0;
        if (totalTasks > 0) {
          overallProgress = Math.round((completedTasks / totalTasks) * 100);
        } else if (milestones.total > 0) {
          // If no tasks, use milestone progress
          const avgMilestoneProgress = milestones.documents.reduce(
            (acc, m) => acc + (m.progress || 0),
            0
          ) / milestones.total;
          overallProgress = Math.round(avgMilestoneProgress);
        }

        const analytics: ProgramAnalytics = {
          programId: program.$id,
          totalProjects: projects.total,
          activeProjects,
          completedProjects,
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          overdueTasks,
          totalMembers: members.total,
          totalMilestones: milestones.total,
          completedMilestones,
          overallProgress,
          // burndownData and velocityTrend can be added later with more complex calculations
        };

        return c.json({ data: analytics });
      } catch (error) {
        console.error("Analytics error:", error);
        return c.json({ error: "Failed to calculate analytics" }, 500);
      }
    }
  )

  // ========================================
  // GET /api/programs/:programId/analytics/summary - Get quick summary
  // ========================================
  .get(
    "/summary",
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

      try {
        // Get counts only (fast queries)
        const [projects, members, milestones, completedMilestones] = await Promise.all([
          databases.listDocuments<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            [Query.equal("programId", programId), Query.limit(1)]
          ),
          databases.listDocuments<ProgramMember>(
            DATABASE_ID,
            PROGRAM_MEMBERS_ID,
            [Query.equal("programId", programId), Query.limit(1)]
          ),
          databases.listDocuments<ProgramMilestone>(
            DATABASE_ID,
            PROGRAM_MILESTONES_ID,
            [Query.equal("programId", programId), Query.limit(1)]
          ),
          databases.listDocuments<ProgramMilestone>(
            DATABASE_ID,
            PROGRAM_MILESTONES_ID,
            [
              Query.equal("programId", programId),
              Query.equal("status", MilestoneStatus.COMPLETED),
              Query.limit(1),
            ]
          ),
        ]);

        return c.json({
          data: {
            projectCount: projects.total,
            memberCount: members.total,
            milestoneCount: milestones.total,
            completedMilestoneCount: completedMilestones.total,
          },
        });
      } catch {
        return c.json({ error: "Failed to get summary" }, 500);
      }
    }
  )

  // ========================================
  // GET /api/programs/:programId/analytics/milestones - Get milestone progress
  // ========================================
  .get(
    "/milestones",
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

      try {
        const milestones = await databases.listDocuments<ProgramMilestone>(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          [
            Query.equal("programId", programId),
            Query.orderAsc("position"),
          ]
        );

        // Calculate stats
        const total = milestones.total;
        const completed = milestones.documents.filter(
          (m) => m.status === MilestoneStatus.COMPLETED
        ).length;
        const inProgress = milestones.documents.filter(
          (m) => m.status === MilestoneStatus.IN_PROGRESS
        ).length;
        const delayed = milestones.documents.filter(
          (m) => m.status === MilestoneStatus.DELAYED
        ).length;
        const notStarted = milestones.documents.filter(
          (m) => m.status === MilestoneStatus.NOT_STARTED
        ).length;

        // Average progress
        const avgProgress = total > 0
          ? Math.round(
              milestones.documents.reduce((acc, m) => acc + (m.progress || 0), 0) / total
            )
          : 0;

        return c.json({
          data: {
            total,
            completed,
            inProgress,
            delayed,
            notStarted,
            avgProgress,
            milestones: milestones.documents.map((m) => ({
              $id: m.$id,
              name: m.name,
              status: m.status,
              progress: m.progress,
              targetDate: m.targetDate,
            })),
          },
        });
      } catch {
        return c.json({ error: "Failed to get milestone analytics" }, 500);
      }
    }
  );

export default app;
