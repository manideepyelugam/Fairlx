import { Query } from "node-appwrite";
import { DATABASE_ID, TEAMS_ID, TEAM_MEMBERS_ID, MEMBERS_ID } from "@/config";
import { createSessionClient } from "@/lib/appwrite";
import {
  Team,
  TeamMember,
  PopulatedTeam,
  PopulatedTeamMember,
  TeamWithMembers,
  TeamFilters,
  TeamMemberFilters,
} from "./types";

/**
 * Get a team by ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const { databases } = await createSessionClient();
    const team = await databases.getDocument(DATABASE_ID, TEAMS_ID, teamId);
    return team as Team;
  } catch (error) {
    console.error("Error fetching team:", error);
    return null;
  }
}

/**
 * Get teams with filters
 */
export async function getTeams(
  filters: TeamFilters
): Promise<{ teams: Team[]; total: number }> {
  try {
    const { databases } = await createSessionClient();
    const queries: string[] = [];

    if (filters.workspaceId) {
      queries.push(Query.equal("workspaceId", filters.workspaceId));
    }

    if (filters.programId) {
      queries.push(Query.equal("programId", filters.programId));
    }

    if (filters.visibility) {
      queries.push(Query.equal("visibility", filters.visibility));
    }

    if (filters.teamLeadId) {
      queries.push(Query.equal("teamLeadId", filters.teamLeadId));
    }

    if (filters.search) {
      queries.push(Query.search("name", filters.search));
    }

    // Order by creation date (newest first)
    queries.push(Query.orderDesc("$createdAt"));

    const response = await databases.listDocuments(
      DATABASE_ID,
      TEAMS_ID,
      queries
    );

    return {
      teams: response.documents as Team[],
      total: response.total,
    };
  } catch (error) {
    console.error("Error fetching teams:", error);
    return { teams: [], total: 0 };
  }
}

/**
 * Get team members with filters
 */
export async function getTeamMembers(
  filters: TeamMemberFilters
): Promise<{ members: TeamMember[]; total: number }> {
  try {
    const { databases } = await createSessionClient();
    const queries: string[] = [];

    if (filters.teamId) {
      queries.push(Query.equal("teamId", filters.teamId));
    }

    if (filters.memberId) {
      queries.push(Query.equal("memberId", filters.memberId));
    }

    if (filters.role) {
      queries.push(Query.equal("role", filters.role));
    }

    if (filters.availability) {
      queries.push(Query.equal("availability", filters.availability));
    }

    if (filters.isActive !== undefined) {
      queries.push(Query.equal("isActive", filters.isActive));
    }

    // Order by join date (oldest first)
    queries.push(Query.orderAsc("joinedAt"));

    const response = await databases.listDocuments(
      DATABASE_ID,
      TEAM_MEMBERS_ID,
      queries
    );

    return {
      members: response.documents as TeamMember[],
      total: response.total,
    };
  } catch (error) {
    console.error("Error fetching team members:", error);
    return { members: [], total: 0 };
  }
}

/**
 * Get populated team (with team lead and program info)
 */
export async function getPopulatedTeam(
  teamId: string
): Promise<PopulatedTeam | null> {
  try {
    const team = await getTeamById(teamId);
    if (!team) return null;

    const { databases } = await createSessionClient();
    const populatedTeam: PopulatedTeam = { ...team };

    // Fetch team lead if available
    if (team.teamLeadId) {
      try {
        const teamLead = await databases.getDocument(
          DATABASE_ID,
          MEMBERS_ID,
          team.teamLeadId
        );
        populatedTeam.teamLead = {
          $id: teamLead.$id,
          userId: teamLead.userId,
          name: teamLead.name || teamLead.email,
          email: teamLead.email,
          profileImageUrl: teamLead.profileImageUrl,
        };
      } catch (error) {
        console.error("Error fetching team lead:", error);
      }
    }

    // Fetch program if available
    if (team.programId) {
      try {
        const { PROGRAMS_ID } = await import("@/config");
        const program = await databases.getDocument(
          DATABASE_ID,
          PROGRAMS_ID,
          team.programId
        );
        populatedTeam.program = {
          $id: program.$id,
          name: program.name,
          description: program.description,
        };
      } catch (error) {
        console.error("Error fetching program:", error);
      }
    }

    // Get member count
    const { total } = await getTeamMembers({
      teamId: team.$id,
      isActive: true,
    });
    populatedTeam.memberCount = total;

    return populatedTeam;
  } catch (error) {
    console.error("Error fetching populated team:", error);
    return null;
  }
}

/**
 * Get team with all members (populated with user details)
 */
export async function getTeamWithMembers(
  teamId: string
): Promise<TeamWithMembers | null> {
  try {
    const team = await getTeamById(teamId);
    if (!team) return null;

    const { databases } = await createSessionClient();
    const { members } = await getTeamMembers({ teamId, isActive: true });

    // Populate each member with user details
    const populatedMembers: (PopulatedTeamMember | null)[] = await Promise.all(
      members.map(async (member) => {
        try {
          const user = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            member.memberId
          );

          return {
            ...member,
            user: {
              $id: user.$id,
              userId: user.userId,
              name: user.name || user.email,
              email: user.email,
              profileImageUrl: user.profileImageUrl,
              role: user.role,
            },
            team: {
              $id: team.$id,
              name: team.name,
              imageUrl: team.imageUrl,
            },
          } as PopulatedTeamMember;
        } catch (error) {
          console.error("Error fetching member details:", error);
          return null;
        }
      })
    );

    // Filter out any failed member fetches
    const validMembers = populatedMembers.filter(
      (m): m is PopulatedTeamMember => m !== null
    );

    return {
      ...team,
      members: validMembers,
      memberCount: validMembers.length,
    };
  } catch (error) {
    console.error("Error fetching team with members:", error);
    return null;
  }
}

/**
 * Check if a member belongs to a team
 */
export async function isMemberOfTeam(
  teamId: string,
  memberId: string
): Promise<boolean> {
  try {
    const { members } = await getTeamMembers({
      teamId,
      memberId,
      isActive: true,
    });
    return members.length > 0;
  } catch (error) {
    console.error("Error checking team membership:", error);
    return false;
  }
}

/**
 * Check if a user is a team lead
 */
export async function isTeamLead(
  teamId: string,
  memberId: string
): Promise<boolean> {
  try {
    const team = await getTeamById(teamId);
    if (!team) return false;
    return team.teamLeadId === memberId;
  } catch (error) {
    console.error("Error checking team lead status:", error);
    return false;
  }
}

/**
 * Get all teams for a member
 */
export async function getMemberTeams(
  memberId: string,
  workspaceId: string
): Promise<Team[]> {
  try {
    const { members } = await getTeamMembers({ memberId, isActive: true });
    const teamIds = members.map((m) => m.teamId);

    if (teamIds.length === 0) return [];

    const { databases } = await createSessionClient();
    const queries = [
      Query.equal("$id", teamIds),
      Query.equal("workspaceId", workspaceId),
      Query.orderDesc("$createdAt"),
    ];

    const response = await databases.listDocuments(
      DATABASE_ID,
      TEAMS_ID,
      queries
    );

    return response.documents as Team[];
  } catch (error) {
    console.error("Error fetching member teams:", error);
    return [];
  }
}

/**
 * Get team member count
 */
export async function getTeamMemberCount(
  teamId: string,
  activeOnly: boolean = true
): Promise<number> {
  try {
    const { total } = await getTeamMembers({
      teamId,
      isActive: activeOnly ? true : undefined,
    });
    return total;
  } catch (error) {
    console.error("Error getting team member count:", error);
    return 0;
  }
}

/**
 * Check if team name exists in workspace
 */
export async function teamNameExists(
  workspaceId: string,
  name: string,
  excludeTeamId?: string
): Promise<boolean> {
  try {
    const { databases } = await createSessionClient();
    const queries = [
      Query.equal("workspaceId", workspaceId),
      Query.equal("name", name),
    ];

    const response = await databases.listDocuments(
      DATABASE_ID,
      TEAMS_ID,
      queries
    );

    if (excludeTeamId) {
      return response.documents.some((doc) => doc.$id !== excludeTeamId);
    }

    return response.total > 0;
  } catch (error) {
    console.error("Error checking team name:", error);
    return false;
  }
}

/**
 * Format team member for display
 */
export function formatTeamMember(member: PopulatedTeamMember): string {
  const role = member.role === "LEAD" ? " (Lead)" : "";
  return `${member.user.name}${role}`;
}

/**
 * Calculate team utilization rate
 */
export function calculateUtilizationRate(
  allocated: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((allocated / total) * 100);
}
