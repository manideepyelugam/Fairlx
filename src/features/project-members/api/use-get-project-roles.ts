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
        queryKey: ["project-roles", projectId, workspaceId],
        queryFn: async () => {
            if (!projectId) return null;

            const response = await client.api["project-members"]["roles"].$get({
                query: {
                    projectId,
                    ...(workspaceId && { workspaceId }),
                },
            });

            if (!response.ok) {
                await response.json().catch(() => ({}));
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Auth Error: ${response.status}`);
                }
                throw new Error("Failed to fetch project roles");
            }

            const json = await response.json();
            return json.data as { documents: ProjectRole[]; total: number };
        },
        enabled: !!projectId && (workspaceId !== undefined ? !!workspaceId : true),
        retry: (failureCount, error) => {
            if (error.message.includes("Auth Error")) return false;
            if (error.message.includes("401") || error.message.includes("403")) return false;
            return failureCount < 3;
        },
    });
};
