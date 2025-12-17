import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { PopulatedProjectMember } from "../types";

interface UseGetProjectMembersProps {
    projectId: string | null | undefined;
    teamId?: string | null;
    workspaceId?: string | null;
}

/**
 * Hook to fetch all members in a project (optionally filtered by team)
 */
export const useGetProjectMembers = ({
    projectId,
    teamId,
    workspaceId,
}: UseGetProjectMembersProps) => {
    return useQuery({
        queryKey: ["project-members", projectId, teamId],
        queryFn: async () => {
            if (!projectId) return null;

            const response = await client.api["project-members"].$get({
                query: {
                    projectId,
                    ...(teamId && { teamId }),
                    ...(workspaceId && { workspaceId }),
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch project members");
            }

            const json = await response.json();
            return json.data as { documents: PopulatedProjectMember[]; total: number };
        },
        enabled: !!projectId,
    });
};
