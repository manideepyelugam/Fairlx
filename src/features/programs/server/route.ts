import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, PROGRAMS_ID, MEMBERS_ID } from "@/config";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { Program, ProgramStatus } from "../types";
import { programSchemas } from "../schemas";

const app = new Hono()
  // ========================================
  // GET /api/programs - List all programs with filters
  // ========================================
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", programSchemas.getPrograms),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const filters = c.req.valid("query");

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId: filters.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Build query filters
      const queryFilters: string[] = [Query.equal("workspaceId", filters.workspaceId)];

      if (filters.status) {
        queryFilters.push(Query.equal("status", filters.status));
      }

      if (filters.programLeadId) {
        queryFilters.push(Query.equal("programLeadId", filters.programLeadId));
      }

      if (filters.search) {
        queryFilters.push(Query.search("name", filters.search));
      }

      const programs = await databases.listDocuments<Program>(
        DATABASE_ID,
        PROGRAMS_ID,
        queryFilters
      );

      return c.json({ data: programs });
    }
  )

  // ========================================
  // GET /api/programs/:programId - Get single program
  // ========================================
  .get("/:programId", sessionMiddleware, async (c) => {
    const { users } = await createAdminClient();
    const databases = c.get("databases");
    const user = c.get("user");
    const { programId } = c.req.param();

    try {
      const program = await databases.getDocument<Program>(
        DATABASE_ID,
        PROGRAMS_ID,
        programId
      );

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId: program.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Populate program lead if exists
      let programLead = null;
      if (program.programLeadId) {
        try {
          const leadMember = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            program.programLeadId
          );
          const leadUser = await users.get(leadMember.userId);
          const prefs = leadUser.prefs as { profileImageUrl?: string | null } | undefined;

          programLead = {
            $id: leadUser.$id,
            name: leadUser.name || leadUser.email,
            email: leadUser.email,
            profileImageUrl: prefs?.profileImageUrl ?? null,
          };
        } catch {
          // Program lead not found
          programLead = null;
        }
      }

      // Team count removed (dependent on legacy teams)
      const populatedProgram = {
        ...program,
        programLead,
        statistics: {
          teamCount: 0,
        },
      };

      return c.json({ data: populatedProgram });
    } catch {
      return c.json({ error: "Program not found" }, 404);
    }
  })

  // ========================================
  // POST /api/programs - Create new program
  // ========================================
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", programSchemas.createProgram),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const data = c.req.valid("json");

      // Verify user is admin in workspace
      const member = await getMember({
        databases,
        workspaceId: data.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json(
          { error: "Unauthorized. Only workspace admins can create programs." },
          403
        );
      }

      // Check for duplicate program name
      const existingPrograms = await databases.listDocuments<Program>(
        DATABASE_ID,
        PROGRAMS_ID,
        [
          Query.equal("workspaceId", data.workspaceId),
          Query.equal("name", data.name),
        ]
      );

      if (existingPrograms.total > 0) {
        return c.json({ error: "Program name already exists in this workspace" }, 409);
      }

      // Create the program
      const program = await databases.createDocument<Program>(
        DATABASE_ID,
        PROGRAMS_ID,
        ID.unique(),
        {
          name: data.name,
          description: data.description || null,
          workspaceId: data.workspaceId,
          programLeadId: data.programLeadId || null,
          imageUrl: data.imageUrl || null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          status: data.status || ProgramStatus.PLANNING,
          createdBy: user.$id,
          lastModifiedBy: null,
        }
      );

      return c.json({ data: program }, 201);
    }
  )

  // ========================================
  // PATCH /api/programs/:programId - Update program
  // ========================================
  .patch(
    "/:programId",
    sessionMiddleware,
    zValidator("json", programSchemas.updateProgram),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { programId } = c.req.param();
      const updates = c.req.valid("json");

      try {
        const program = await databases.getDocument<Program>(
          DATABASE_ID,
          PROGRAMS_ID,
          programId
        );

        // Verify user is admin in workspace
        const member = await getMember({
          databases,
          workspaceId: program.workspaceId,
          userId: user.$id,
        });

        if (!member || member.role !== MemberRole.ADMIN) {
          return c.json(
            { error: "Unauthorized. Only workspace admins can update programs." },
            403
          );
        }

        // Check for duplicate name if name is being changed
        if (updates.name && updates.name !== program.name) {
          const existingPrograms = await databases.listDocuments<Program>(
            DATABASE_ID,
            PROGRAMS_ID,
            [
              Query.equal("workspaceId", program.workspaceId),
              Query.equal("name", updates.name),
            ]
          );

          if (existingPrograms.total > 0) {
            return c.json({ error: "Program name already exists in this workspace" }, 409);
          }
        }

        // Update the program
        const updatedProgram = await databases.updateDocument<Program>(
          DATABASE_ID,
          PROGRAMS_ID,
          programId,
          {
            ...updates,
            lastModifiedBy: user.$id,
          }
        );

        return c.json({ data: updatedProgram });
      } catch {
        return c.json({ error: "Program not found" }, 404);
      }
    }
  )

  // ========================================
  // DELETE /api/programs/:programId - Delete program
  // ========================================
  .delete("/:programId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { programId } = c.req.param();

    try {
      const program = await databases.getDocument<Program>(
        DATABASE_ID,
        PROGRAMS_ID,
        programId
      );

      // Verify user is admin in workspace
      const member = await getMember({
        databases,
        workspaceId: program.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json(
          { error: "Unauthorized. Only workspace admins can delete programs." },
          403
        );
      }

      // Legacy team check removed
      // if (teams.total > 0) { ... }

      // Delete the program
      await databases.deleteDocument(DATABASE_ID, PROGRAMS_ID, programId);

      return c.json({ data: { $id: programId } });
    } catch {
      return c.json({ error: "Program not found" }, 404);
    }
  })

// ========================================
// GET /api/programs/:programId/teams - Get all teams in program
// ========================================
/* Legacy team endpoint removed
.get("/:programId/teams", sessionMiddleware, async (c) => {
  // ... removed
  return c.json({ data: { documents: [], total: 0 } });
});
*/

export default app;
