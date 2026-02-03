import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetProjectTeamsProps {
    projectId: string | undefined;
}

export const useGetProjectTeams = ({ projectId }: UseGetProjectTeamsProps) => {
    return useQuery({
        queryKey: ["project-teams", projectId],
        queryFn: async () => {
            if (!projectId) {
                throw new Error("Project ID is required");
            }
            
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
    });
};
