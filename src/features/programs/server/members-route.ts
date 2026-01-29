import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, PROGRAMS_ID, PROGRAM_MEMBERS_ID, MEMBERS_ID } from "@/config";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { 
  Program, 
  ProgramMember, 
  ProgramMemberRole,
  PopulatedProgramMember 
} from "../types";
import { programSchemas } from "../schemas";

/**
 * Check if user has permission to manage program members
 * Must be program LEAD or ADMIN, or workspace ADMIN
 */
async function canManageProgramMembers(
  databases: Parameters<typeof getMember>[0]["databases"],
  programId: string,
  userId: string
): Promise<{ allowed: boolean; program?: Program; workspaceMember?: Awaited<ReturnType<typeof getMember>> }> {
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
      return { allowed: true, program, workspaceMember };
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
      return { allowed: false, program, workspaceMember };
    }

    const programMember = programMembers.documents[0];
    const canManage = [ProgramMemberRole.LEAD, ProgramMemberRole.ADMIN].includes(
      programMember.role as ProgramMemberRole
    );

    return { allowed: canManage, program, workspaceMember };
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
  // GET /api/programs/:programId/members - List program members
  // ========================================
  .get(
    "/",
    sessionMiddleware,
    async (c) => {
      const { users } = await createAdminClient();
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

      // Get all program members
      const members = await databases.listDocuments<ProgramMember>(
        DATABASE_ID,
        PROGRAM_MEMBERS_ID,
        [
          Query.equal("programId", programId),
          Query.orderDesc("$createdAt"),
        ]
      );

      // Populate user details for each member
      const populatedMembers: PopulatedProgramMember[] = await Promise.all(
        members.documents.map(async (member) => {
          try {
            // Get the workspace member to find user details
            const workspaceMember = await databases.getDocument(
              DATABASE_ID,
              MEMBERS_ID,
              member.userId
            );
            
            const userDetails = await users.get(workspaceMember.userId);
            const prefs = userDetails.prefs as { profileImageUrl?: string | null } | undefined;

            return {
              ...member,
              user: {
                $id: userDetails.$id,
                name: userDetails.name || userDetails.email,
                email: userDetails.email,
                profileImageUrl: prefs?.profileImageUrl ?? undefined,
              },
            };
          } catch {
            // If user not found, return member without user details
            return {
              ...member,
              user: {
                $id: member.userId,
                name: "Unknown User",
                email: "",
                profileImageUrl: undefined,
              },
            };
          }
        })
      );

      return c.json({ 
        data: { 
          documents: populatedMembers, 
          total: members.total 
        } 
      });
    }
  )

  // ========================================
  // POST /api/programs/:programId/members - Add member to program
  // ========================================
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", programSchemas.addProgramMember),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const { userId, role } = c.req.valid("json");

      if (!programId) {
        return c.json({ error: "Program ID is required" }, 400);
      }

      // Verify user can manage program members
      const { allowed, program } = await canManageProgramMembers(
        databases,
        programId,
        user.$id
      );

      if (!allowed || !program) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can add members." },
          403
        );
      }

      // Verify target user is a workspace member
      const targetWorkspaceMember = await getMember({
        databases,
        workspaceId: program.workspaceId,
        userId,
      });

      if (!targetWorkspaceMember) {
        return c.json(
          { error: "User must be a workspace member to be added to a program" },
          400
        );
      }

      // Check if user is already a program member
      const existingMember = await databases.listDocuments<ProgramMember>(
        DATABASE_ID,
        PROGRAM_MEMBERS_ID,
        [
          Query.equal("programId", programId),
          Query.equal("userId", userId),
        ]
      );

      if (existingMember.total > 0) {
        return c.json({ error: "User is already a member of this program" }, 409);
      }

      // Create program member
      const member = await databases.createDocument<ProgramMember>(
        DATABASE_ID,
        PROGRAM_MEMBERS_ID,
        ID.unique(),
        {
          programId,
          workspaceId: program.workspaceId,
          userId,
          role,
          addedBy: user.$id,
          addedAt: new Date().toISOString(),
        }
      );

      return c.json({ data: member }, 201);
    }
  )

  // ========================================
  // PATCH /api/programs/:programId/members/:memberId - Update member role
  // ========================================
  .patch(
    "/:memberId",
    sessionMiddleware,
    zValidator("json", programSchemas.updateProgramMember),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const memberId = c.req.param("memberId") as string;
      const { role } = c.req.valid("json");

      if (!programId || !memberId) {
        return c.json({ error: "Program ID and Member ID are required" }, 400);
      }

      // Verify user can manage program members
      const { allowed } = await canManageProgramMembers(
        databases,
        programId,
        user.$id
      );

      if (!allowed) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can update members." },
          403
        );
      }

      try {
        // Get the member to verify it belongs to this program
        const member = await databases.getDocument<ProgramMember>(
          DATABASE_ID,
          PROGRAM_MEMBERS_ID,
          memberId
        );

        if (member.programId !== programId) {
          return c.json({ error: "Member not found in this program" }, 404);
        }

        // Prevent changing own role if LEAD (must have at least one lead)
        if (member.userId === user.$id && member.role === ProgramMemberRole.LEAD) {
          // Count other leads
          const otherLeads = await databases.listDocuments<ProgramMember>(
            DATABASE_ID,
            PROGRAM_MEMBERS_ID,
            [
              Query.equal("programId", programId),
              Query.equal("role", ProgramMemberRole.LEAD),
              Query.notEqual("$id", memberId),
            ]
          );

          if (otherLeads.total === 0 && role !== ProgramMemberRole.LEAD) {
            return c.json(
              { error: "Cannot change role. Program must have at least one lead." },
              400
            );
          }
        }

        // Update member role
        const updatedMember = await databases.updateDocument<ProgramMember>(
          DATABASE_ID,
          PROGRAM_MEMBERS_ID,
          memberId,
          { role }
        );

        return c.json({ data: updatedMember });
      } catch {
        return c.json({ error: "Member not found" }, 404);
      }
    }
  )

  // ========================================
  // DELETE /api/programs/:programId/members/:memberId - Remove member
  // ========================================
  .delete(
    "/:memberId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const programId = c.req.param("programId") as string;
      const memberId = c.req.param("memberId") as string;

      if (!programId || !memberId) {
        return c.json({ error: "Program ID and Member ID are required" }, 400);
      }

      // Verify user can manage program members
      const { allowed } = await canManageProgramMembers(
        databases,
        programId,
        user.$id
      );

      if (!allowed) {
        return c.json(
          { error: "Unauthorized. Only program leads/admins or workspace admins can remove members." },
          403
        );
      }

      try {
        // Get the member to verify it belongs to this program
        const member = await databases.getDocument<ProgramMember>(
          DATABASE_ID,
          PROGRAM_MEMBERS_ID,
          memberId
        );

        if (member.programId !== programId) {
          return c.json({ error: "Member not found in this program" }, 404);
        }

        // Prevent removing the last lead
        if (member.role === ProgramMemberRole.LEAD) {
          const otherLeads = await databases.listDocuments<ProgramMember>(
            DATABASE_ID,
            PROGRAM_MEMBERS_ID,
            [
              Query.equal("programId", programId),
              Query.equal("role", ProgramMemberRole.LEAD),
              Query.notEqual("$id", memberId),
            ]
          );

          if (otherLeads.total === 0) {
            return c.json(
              { error: "Cannot remove the last program lead. Assign another lead first." },
              400
            );
          }
        }

        // Delete the member
        await databases.deleteDocument(DATABASE_ID, PROGRAM_MEMBERS_ID, memberId);

        return c.json({ data: { $id: memberId } });
      } catch {
        return c.json({ error: "Member not found" }, 404);
      }
    }
  );

export default app;
