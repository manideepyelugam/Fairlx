import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { ProjectRole } from "../types";

interface UseGetProjectRolesProps {
    projectId: string | null | undefined;
    workspaceId?: string | null;
}

/**
 * Hook to fetch all roles for a project
 */
export const useGetProjectRoles = ({
    projectId,
    workspaceId,
}: UseGetProjectRolesProps) => {
    return useQuery({
        queryKey: ["project-roles", projectId],
        queryFn: async () => {
            if (!projectId) return null;

            const response = await client.api["project-members"]["roles"].$get({
                query: {
                    projectId,
                    ...(workspaceId && { workspaceId }),
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch project roles");
            }

            const json = await response.json();
            return json.data as { documents: ProjectRole[]; total: number };
        },
        enabled: !!projectId,
    });
};
