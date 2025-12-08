import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetCustomWorkItemTypesProps {
  workspaceId?: string;
  projectId?: string;
  includeSubtasks?: boolean;
  activeOnly?: boolean;
}

export const useGetCustomWorkItemTypes = ({ 
  workspaceId, 
  projectId, 
  includeSubtasks = false,
  activeOnly = true,
}: UseGetCustomWorkItemTypesProps) => {
  const query = useQuery({
    queryKey: ["custom-work-item-types", workspaceId, projectId, includeSubtasks, activeOnly],
    enabled: !!workspaceId,
    queryFn: async () => {
      if (!workspaceId) return null;

      const response = await client.api["custom-fields"]["types"].$get({
        query: { 
          workspaceId,
          projectId: projectId || undefined,
          includeSubtasks: includeSubtasks ? "true" : undefined,
          activeOnly: activeOnly ? "true" : undefined,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch custom work item types.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
