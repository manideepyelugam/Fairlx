import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, PROGRAMS_ID, PROGRAM_MEMBERS_ID, PROGRAM_MILESTONES_ID } from "@/config";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { 
  Program, 
  ProgramMember, 
  ProgramMemberRole,
  ProgramMilestone,
  MilestoneStatus 
} from "../types";
import { programSchemas } from "../schemas";

/**
 * Check if user can manage program milestones
 * Must be program LEAD or ADMIN, or workspace ADMIN
 */
async function canManageMilestones(
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
  // GET /api/programs/:programId/milestones - List program milestones
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

      // Get all milestones for this program, ordered by position
      const milestones = await databases.listDocuments<ProgramMilestone>(
        DATABASE_ID,
        PROGRAM_MILESTONES_ID,
        [
          Query.equal("programId", programId),
          Query.orderAsc("position"),
          Query.orderAsc("$createdAt"),
        ]
      );

      return c.json({ 
        data: { 
          documents: milestones.documents, 
          total: milestones.total 
        } 
      });
    }
  )

  // ========================================
  // POST /api/programs/:programId/milestones - Create milestone
  // ========================================
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", programSchemas.createMilestone),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const data = c.req.valid("json");

      if (!programId) {
        return c.json({ error: "Program ID is required" }, 400);
      }

      // Verify user can manage milestones
      const { allowed, program } = await canManageMilestones(
        databases,
        programId,
        user.$id
      );

      if (!allowed || !program) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can create milestones." },
          403
        );
      }

      // Get current max position
      const existingMilestones = await databases.listDocuments<ProgramMilestone>(
        DATABASE_ID,
        PROGRAM_MILESTONES_ID,
        [
          Query.equal("programId", programId),
          Query.orderDesc("position"),
          Query.limit(1),
        ]
      );

      const nextPosition = existingMilestones.total > 0 
        ? (existingMilestones.documents[0].position || 0) + 1 
        : 0;

      // Create the milestone
      const milestone = await databases.createDocument<ProgramMilestone>(
        DATABASE_ID,
        PROGRAM_MILESTONES_ID,
        ID.unique(),
        {
          programId,
          name: data.name,
          description: data.description || null,
          targetDate: data.targetDate || null,
          status: data.status || MilestoneStatus.NOT_STARTED,
          progress: 0,
          createdBy: user.$id,
          position: nextPosition,
        }
      );

      return c.json({ data: milestone }, 201);
    }
  )

  // ========================================
  // GET /api/programs/:programId/milestones/:milestoneId - Get single milestone
  // ========================================
  .get(
    "/:milestoneId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const milestoneId = c.req.param("milestoneId") as string;

      if (!programId || !milestoneId) {
        return c.json({ error: "Program ID and Milestone ID are required" }, 400);
      }

      // Verify user has access to this program
      const hasAccess = await isProgramMember(databases, programId, user.$id);
      if (!hasAccess) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const milestone = await databases.getDocument<ProgramMilestone>(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          milestoneId
        );

        if (milestone.programId !== programId) {
          return c.json({ error: "Milestone not found in this program" }, 404);
        }

        return c.json({ data: milestone });
      } catch {
        return c.json({ error: "Milestone not found" }, 404);
      }
    }
  )

  // ========================================
  // PATCH /api/programs/:programId/milestones/:milestoneId - Update milestone
  // ========================================
  .patch(
    "/:milestoneId",
    sessionMiddleware,
    zValidator("json", programSchemas.updateMilestone),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const milestoneId = c.req.param("milestoneId") as string;
      const updates = c.req.valid("json");

      if (!programId || !milestoneId) {
        return c.json({ error: "Program ID and Milestone ID are required" }, 400);
      }

      // Verify user can manage milestones
      const { allowed } = await canManageMilestones(
        databases,
        programId,
        user.$id
      );

      if (!allowed) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can update milestones." },
          403
        );
      }

      try {
        // Verify milestone belongs to this program
        const milestone = await databases.getDocument<ProgramMilestone>(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          milestoneId
        );

        if (milestone.programId !== programId) {
          return c.json({ error: "Milestone not found in this program" }, 404);
        }

        // Build update payload
        const updatePayload: Partial<ProgramMilestone> = {};
        
        if (updates.name !== undefined) updatePayload.name = updates.name;
        if (updates.description !== undefined) {
          updatePayload.description = updates.description;
        }
        if (updates.targetDate !== undefined) {
          updatePayload.targetDate = updates.targetDate ?? undefined;
        }
        if (updates.status !== undefined) updatePayload.status = updates.status;
        if (updates.progress !== undefined) updatePayload.progress = updates.progress;
        if (updates.position !== undefined) updatePayload.position = updates.position;

        // Auto-set progress to 100 if status is COMPLETED
        if (updates.status === MilestoneStatus.COMPLETED && updates.progress === undefined) {
          updatePayload.progress = 100;
        }

        const updatedMilestone = await databases.updateDocument<ProgramMilestone>(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          milestoneId,
          updatePayload
        );

        return c.json({ data: updatedMilestone });
      } catch {
        return c.json({ error: "Milestone not found" }, 404);
      }
    }
  )

  // ========================================
  // DELETE /api/programs/:programId/milestones/:milestoneId - Delete milestone
  // ========================================
  .delete(
    "/:milestoneId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const milestoneId = c.req.param("milestoneId") as string;

      if (!programId || !milestoneId) {
        return c.json({ error: "Program ID and Milestone ID are required" }, 400);
      }

      // Verify user can manage milestones
      const { allowed } = await canManageMilestones(
        databases,
        programId,
        user.$id
      );

      if (!allowed) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can delete milestones." },
          403
        );
      }

      try {
        // Verify milestone belongs to this program
        const milestone = await databases.getDocument<ProgramMilestone>(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          milestoneId
        );

        if (milestone.programId !== programId) {
          return c.json({ error: "Milestone not found in this program" }, 404);
        }

        // Delete the milestone
        await databases.deleteDocument(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          milestoneId
        );

        return c.json({ data: { $id: milestoneId } });
      } catch {
        return c.json({ error: "Milestone not found" }, 404);
      }
    }
  )

  // ========================================
  // PATCH /api/programs/:programId/milestones/reorder - Reorder milestones
  // ========================================
  .patch(
    "/reorder",
    sessionMiddleware,
    zValidator("json", programSchemas.reorderMilestones),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const { milestoneIds } = c.req.valid("json");

      if (!programId) {
        return c.json({ error: "Program ID is required" }, 400);
      }

      // Verify user can manage milestones
      const { allowed } = await canManageMilestones(
        databases,
        programId,
        user.$id
      );

      if (!allowed) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can reorder milestones." },
          403
        );
      }

      // Update positions for each milestone
      const updatePromises = milestoneIds.map((id, index) =>
        databases.updateDocument(
          DATABASE_ID,
          PROGRAM_MILESTONES_ID,
          id,
          { position: index }
        )
      );

      await Promise.all(updatePromises);

      return c.json({ data: { success: true } });
    }
  );

export default app;
