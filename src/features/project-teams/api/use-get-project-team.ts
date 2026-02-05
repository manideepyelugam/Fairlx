import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetProjectTeamProps {
    teamId: string;
    enabled?: boolean;
}

/**
 * Hook to fetch a single team with its members
 */
export const useGetProjectTeam = ({ teamId, enabled = true }: UseGetProjectTeamProps) => {
    return useQuery({
        queryKey: ["project-team", teamId],
        queryFn: async () => {
            const response = await client.api["project-teams"][":teamId"].$get({
                param: { teamId },
            });

            if (!response.ok) {
                throw new Error("Failed to get team");
            }

            const data = await response.json();
            return data.data;
        },
        enabled: !!teamId && enabled,
    });
};
