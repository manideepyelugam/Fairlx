import { useQueries } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetMultipleProjectTeamsProps {
    projectIds: string[];
}

/**
 * Fetch teams for multiple projects in parallel
 * This hook uses useQueries to handle dynamic number of projects
 * while respecting the Rules of Hooks
 */
export const useGetMultipleProjectTeams = ({ projectIds }: UseGetMultipleProjectTeamsProps) => {
    return useQueries({
        queries: projectIds.map(projectId => ({
            queryKey: ["project-teams", projectId],
            queryFn: async () => {
                const response = await client.api["project-teams"].$get({
                    query: { projectId },
                });

                if (!response.ok) {
                    throw new Error("Failed to get project teams");
                }

                const data = await response.json();
                return data.data;
            },
            enabled: !!projectId,
        })),
    });
};
