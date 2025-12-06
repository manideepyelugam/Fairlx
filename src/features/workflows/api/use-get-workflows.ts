import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export interface UseGetWorkflowsProps {
  workspaceId?: string;
  spaceId?: string;
  projectId?: string;
  includeSystem?: boolean;
}

export const useGetWorkflows = ({ workspaceId, spaceId, projectId }: UseGetWorkflowsProps) => {
  const query = useQuery({
    queryKey: ["workflows", workspaceId, spaceId, projectId],
    enabled: !!workspaceId,
    queryFn: async () => {
      if (!workspaceId) return null;

      const response = await client.api.workflows.$get({
        query: { 
          workspaceId,
          spaceId: spaceId || undefined,
          projectId: projectId || undefined,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workflows.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
