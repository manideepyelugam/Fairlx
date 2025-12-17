"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { PopulatedProjectMember } from "@/features/project-members/types";

interface UseProjectMemberProps {
    projectId: string | null | undefined;
}

/**
 * Hook to get the current user's project membership info.
 * 
 * Returns the user's memberships across all teams in the project,
 * along with their roles and team assignments.
 */
export const useProjectMember = ({ projectId }: UseProjectMemberProps) => {
    const { data, isLoading, error, refetch } = useQuery<PopulatedProjectMember[] | null>({
        queryKey: ["project-member", projectId],
        queryFn: async () => {
            if (!projectId) return null;

            const response = await client.api["project-members"]["current"].$get({
                query: { projectId },
            });

            if (!response.ok) {
                return null;
            }

            const json = await response.json();
            return json.data as PopulatedProjectMember[];
        },
        enabled: !!projectId,
        staleTime: 30000,
    });

    // User is a project member if they have any team membership
    const isMember = (data?.length ?? 0) > 0;

    // Get unique teams the user belongs to
    const teams = data?.map((m) => m.team) || [];
    const uniqueTeams = [...new Map(teams.map((t) => [t.$id, t])).values()];

    // Get unique roles the user has
    const roles = data?.map((m) => m.role) || [];
    const uniqueRoles = [...new Map(roles.map((r) => [r.$id, r])).values()];

    return {
        memberships: data || [],
        isMember,
        isLoading,
        error,
        refetch,
        teams: uniqueTeams,
        roles: uniqueRoles,
        // First membership (for single-team scenarios)
        primaryMembership: data?.[0] || null,
    };
};
