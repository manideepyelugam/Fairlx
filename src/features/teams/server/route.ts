import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, TEAMS_ID, TEAM_MEMBERS_ID, MEMBERS_ID } from "@/config";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import {
  Team,
  TeamMember,
  TeamMemberRole,
  TeamVisibility,
  TeamMemberAvailability,
} from "../types";
import { teamSchemas } from "../schemas";

const app = new Hono()
  // GET /api/teams - List all teams with filters
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", teamSchemas.getTeams),
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

      if (filters.programId) {
        queryFilters.push(Query.equal("programId", filters.programId));
      }

      if (filters.visibility) {
        queryFilters.push(Query.equal("visibility", filters.visibility));
      }

      if (filters.search) {
        queryFilters.push(Query.search("name", filters.search));
      }

      const teams = await databases.listDocuments<Team>(
        DATABASE_ID,
        TEAMS_ID,
        queryFilters
      );

      return c.json({ data: teams });
    }
  )

  // GET /api/teams/:teamId - Get single team (populated)
  .get("/:teamId", sessionMiddleware, async (c) => {
    const { users } = await createAdminClient();
    const databases = c.get("databases");
    const user = c.get("user");
    const { teamId } = c.req.param();

    try {
      const team = await databases.getDocument<Team>(
        DATABASE_ID,
        TEAMS_ID,
        teamId
      );

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId: team.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Populate team lead if exists
      let teamLead = null;
      if (team.teamLeadId) {
        try {
          const leadMember = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            team.teamLeadId
          );
          const leadUser = await users.get(leadMember.userId);
          const prefs = leadUser.prefs as { profileImageUrl?: string | null } | undefined;

          teamLead = {
            $id: leadUser.$id,
            name: leadUser.name || leadUser.email,
            email: leadUser.email,
            profileImageUrl: prefs?.profileImageUrl ?? null,
          };
        } catch {
          teamLead = null;
        }
      }

      // Get member count
      const teamMembers = await databases.listDocuments(
        DATABASE_ID,
        TEAM_MEMBERS_ID,
        [Query.equal("teamId", teamId), Query.equal("isActive", true)]
      );

      const populatedTeam = {
        ...team,
        teamLead,
        statistics: {
          memberCount: teamMembers.total,
        },
      };

      return c.json({ data: populatedTeam });
    } catch (error) {
      return c.json({ error: "Team not found" }, 404);
    }
  })

  // POST /api/teams - Create new team
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", teamSchemas.createTeam),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const data = c.req.valid("json");

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId: data.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check for duplicate team name
      const existingTeams = await databases.listDocuments<Team>(
        DATABASE_ID,
        TEAMS_ID,
        [
          Query.equal("workspaceId", data.workspaceId),
          Query.equal("name", data.name),
        ]
      );

      if (existingTeams.total > 0) {
        return c.json({ error: "Team name already exists in this workspace" }, 409);
      }

      // Create the team
      const team = await databases.createDocument<Team>(
        DATABASE_ID,
        TEAMS_ID,
        ID.unique(),
        {
          name: data.name,
          description: data.description || null,
          workspaceId: data.workspaceId,
          programId: data.programId || null,
          teamLeadId: data.teamLeadId || null,
          imageUrl: data.imageUrl || null,
          visibility: data.visibility || TeamVisibility.ALL,
          createdBy: user.$id,
          lastModifiedBy: null,
        }
      );

      return c.json({ data: team }, 201);
    }
  )

  // PATCH /api/teams/:teamId - Update team
  .patch(
    "/:teamId",
    sessionMiddleware,
    zValidator("json", teamSchemas.updateTeam),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { teamId } = c.req.param();
      const updates = c.req.valid("json");

      try {
        const team = await databases.getDocument<Team>(
          DATABASE_ID,
          TEAMS_ID,
          teamId
        );

        // Verify user is admin in workspace or team lead
        const member = await getMember({
          databases,
          workspaceId: team.workspaceId,
          userId: user.$id,
        });

        // Check if user is team lead
        const teamLeadMembers = await databases.listDocuments<TeamMember>(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          [
            Query.equal("teamId", teamId),
            Query.equal("memberId", member?.$id || ""),
            Query.equal("role", TeamMemberRole.LEAD),
            Query.equal("isActive", true),
          ]
        );
        const isTeamLead = teamLeadMembers.total > 0;

        if (!member || (member.role !== MemberRole.ADMIN && !isTeamLead)) {
          return c.json(
            { error: "Unauthorized. Only workspace admins or team leads can update teams." },
            403
          );
        }

        // Check for duplicate name if name is being changed
        if (updates.name && updates.name !== team.name) {
          const existingTeams = await databases.listDocuments<Team>(
            DATABASE_ID,
            TEAMS_ID,
            [
              Query.equal("workspaceId", team.workspaceId),
              Query.equal("name", updates.name),
            ]
          );

          if (existingTeams.total > 0 && existingTeams.documents[0].$id !== teamId) {
            return c.json({ error: "Team name already exists in this workspace" }, 409);
          }
        }

        // Update the team
        const updatedTeam = await databases.updateDocument<Team>(
          DATABASE_ID,
          TEAMS_ID,
          teamId,
          {
            ...updates,
            lastModifiedBy: user.$id,
          }
        );

        return c.json({ data: updatedTeam });
      } catch (error) {
        return c.json({ error: "Team not found" }, 404);
      }
    }
  )

  // DELETE /api/teams/:teamId - Delete team
  .delete("/:teamId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { teamId } = c.req.param();

    try {
      const team = await databases.getDocument<Team>(
        DATABASE_ID,
        TEAMS_ID,
        teamId
      );

      // Verify user is admin in workspace
      const member = await getMember({
        databases,
        workspaceId: team.workspaceId,
        userId: user.$id,
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json(
          { error: "Unauthorized. Only workspace admins can delete teams." },
          403
        );
      }

      // Delete all team members first
      const teamMembers = await databases.listDocuments<TeamMember>(
        DATABASE_ID,
        TEAM_MEMBERS_ID,
        [Query.equal("teamId", teamId)]
      );

      for (const teamMember of teamMembers.documents) {
        await databases.deleteDocument(DATABASE_ID, TEAM_MEMBERS_ID, teamMember.$id);
      }

      // Delete the team
      await databases.deleteDocument(DATABASE_ID, TEAMS_ID, teamId);

      return c.json({ data: { $id: teamId } });
    } catch (error) {
      return c.json({ error: "Team not found" }, 404);
    }
  })

  // GET /api/teams/:teamId/members - List team members
  .get("/:teamId/members", sessionMiddleware, async (c) => {
    const { users } = await createAdminClient();
    const databases = c.get("databases");
    const user = c.get("user");
    const { teamId } = c.req.param();

    try {
      const team = await databases.getDocument<Team>(
        DATABASE_ID,
        TEAMS_ID,
        teamId
      );

      // Verify user is a member of the workspace
      const member = await getMember({
        databases,
        workspaceId: team.workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get team members
      const teamMembers = await databases.listDocuments<TeamMember>(
        DATABASE_ID,
        TEAM_MEMBERS_ID,
        [Query.equal("teamId", teamId), Query.equal("isActive", true)]
      );

      // Populate with user details
      const populatedMembers = await Promise.all(
        teamMembers.documents.map(async (teamMember) => {
          try {
            // Get member from members collection
            const memberDoc = await databases.getDocument(
              DATABASE_ID,
              MEMBERS_ID,
              teamMember.memberId
            );

            // Get user details
            const userDetails = await users.get(memberDoc.userId);
            const prefs = userDetails.prefs as { profileImageUrl?: string | null } | undefined;

            return {
              ...teamMember,
              user: {
                $id: userDetails.$id,
                name: userDetails.name || userDetails.email,
                email: userDetails.email,
                profileImageUrl: prefs?.profileImageUrl ?? null,
              },
            };
          } catch {
            return null;
          }
        })
      );

      const validMembers = populatedMembers.filter(
        (m): m is NonNullable<typeof m> => m !== null
      );

      return c.json({
        data: {
          ...teamMembers,
          documents: validMembers,
        },
      });
    } catch (error) {
      return c.json({ error: "Team not found" }, 404);
    }
  })

  // POST /api/teams/:teamId/members - Add team member
  .post(
    "/:teamId/members",
    sessionMiddleware,
    zValidator("json", teamSchemas.addTeamMember),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { teamId } = c.req.param();
      const data = c.req.valid("json");

      try {
        const team = await databases.getDocument<Team>(
          DATABASE_ID,
          TEAMS_ID,
          teamId
        );

        // Verify user is admin in workspace or team lead
        const member = await getMember({
          databases,
          workspaceId: team.workspaceId,
          userId: user.$id,
        });

        // Check if user is team lead
        const teamLeadMembers = await databases.listDocuments<TeamMember>(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          [
            Query.equal("teamId", teamId),
            Query.equal("memberId", member?.$id || ""),
            Query.equal("role", TeamMemberRole.LEAD),
            Query.equal("isActive", true),
          ]
        );
        const isTeamLead = teamLeadMembers.total > 0;

        if (!member || (member.role !== MemberRole.ADMIN && !isTeamLead)) {
          return c.json(
            { error: "Unauthorized. Only workspace admins or team leads can add members." },
            403
          );
        }

        // Verify the member to add exists in workspace
        const memberToAdd = await databases.getDocument(
          DATABASE_ID,
          MEMBERS_ID,
          data.memberId
        );

        if (memberToAdd.workspaceId !== team.workspaceId) {
          return c.json({ error: "Member does not belong to this workspace" }, 400);
        }

        // Check if member is already in team
        const existingMembership = await databases.listDocuments<TeamMember>(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          [
            Query.equal("teamId", teamId),
            Query.equal("memberId", data.memberId),
            Query.equal("isActive", true),
          ]
        );

        if (existingMembership.total > 0) {
          return c.json({ error: "Member is already in this team" }, 409);
        }

        // Add team member
        const teamMember = await databases.createDocument<TeamMember>(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          ID.unique(),
          {
            teamId,
            memberId: data.memberId,
            role: data.role || TeamMemberRole.MEMBER,
            availability: data.availability || TeamMemberAvailability.FULL_TIME,
            joinedAt: new Date().toISOString(),
            leftAt: null,
            isActive: true,
            lastModifiedBy: user.$id,
          }
        );

        return c.json({ data: teamMember }, 201);
      } catch (error) {
        return c.json({ error: "Failed to add team member" }, 400);
      }
    }
  )

  // PATCH /api/teams/:teamId/members/:memberId - Update team member
  .patch(
    "/:teamId/members/:memberId",
    sessionMiddleware,
    zValidator("json", teamSchemas.updateTeamMember),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { teamId, memberId } = c.req.param();
      const updates = c.req.valid("json");

      try {
        const team = await databases.getDocument<Team>(
          DATABASE_ID,
          TEAMS_ID,
          teamId
        );

        // Verify user is admin in workspace or team lead
        const workspaceMember = await getMember({
          databases,
          workspaceId: team.workspaceId,
          userId: user.$id,
        });

        // Check if user is team lead
        const teamLeadMembers = await databases.listDocuments<TeamMember>(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          [
            Query.equal("teamId", teamId),
            Query.equal("memberId", workspaceMember?.$id || ""),
            Query.equal("role", TeamMemberRole.LEAD),
            Query.equal("isActive", true),
          ]
        );
        const isTeamLead = teamLeadMembers.total > 0;

        if (!workspaceMember || (workspaceMember.role !== MemberRole.ADMIN && !isTeamLead)) {
          return c.json(
            { error: "Unauthorized. Only workspace admins or team leads can update members." },
            403
          );
        }

        // Find the team member document
        const teamMembers = await databases.listDocuments<TeamMember>(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          [Query.equal("teamId", teamId), Query.equal("memberId", memberId)]
        );

        if (teamMembers.total === 0) {
          return c.json({ error: "Team member not found" }, 404);
        }

        const teamMember = teamMembers.documents[0];

        // Update team member
        const updatedTeamMember = await databases.updateDocument<TeamMember>(
          DATABASE_ID,
          TEAM_MEMBERS_ID,
          teamMember.$id,
          {
            ...updates,
            lastModifiedBy: user.$id,
          }
        );

        return c.json({ data: updatedTeamMember });
      } catch (error) {
        return c.json({ error: "Failed to update team member" }, 400);
      }
    }
  )

  // DELETE /api/teams/:teamId/members/:memberId - Remove team member
  .delete("/:teamId/members/:memberId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { teamId, memberId } = c.req.param();

    try {
      const team = await databases.getDocument<Team>(
        DATABASE_ID,
        TEAMS_ID,
        teamId
      );

      // Verify user is admin in workspace or team lead
      const workspaceMember = await getMember({
        databases,
        workspaceId: team.workspaceId,
        userId: user.$id,
      });

      // Check if user is team lead
      const teamLeadMembers = await databases.listDocuments<TeamMember>(
        DATABASE_ID,
        TEAM_MEMBERS_ID,
        [
          Query.equal("teamId", teamId),
          Query.equal("memberId", workspaceMember?.$id || ""),
          Query.equal("role", TeamMemberRole.LEAD),
          Query.equal("isActive", true),
        ]
      );
      const isTeamLead = teamLeadMembers.total > 0;

      if (!workspaceMember || (workspaceMember.role !== MemberRole.ADMIN && !isTeamLead)) {
        return c.json(
          { error: "Unauthorized. Only workspace admins or team leads can remove members." },
          403
        );
      }

      // Find the team member document
      const teamMembers = await databases.listDocuments<TeamMember>(
        DATABASE_ID,
        TEAM_MEMBERS_ID,
        [Query.equal("teamId", teamId), Query.equal("memberId", memberId)]
      );

      if (teamMembers.total === 0) {
        return c.json({ error: "Team member not found" }, 404);
      }

      const teamMember = teamMembers.documents[0];

      // Soft delete: mark as inactive
      await databases.updateDocument<TeamMember>(
        DATABASE_ID,
        TEAM_MEMBERS_ID,
        teamMember.$id,
        {
          isActive: false,
          leftAt: new Date().toISOString(),
          lastModifiedBy: user.$id,
        }
      );

      return c.json({ data: { $id: teamMember.$id } });
    } catch (error) {
      return c.json({ error: "Failed to remove team member" }, 400);
    }
  });

export default app;
