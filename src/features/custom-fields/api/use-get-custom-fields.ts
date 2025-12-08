import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export interface UseGetCustomFieldsProps {
  workspaceId?: string;
  spaceId?: string;
  projectId?: string;
  appliesTo?: string;
  includeArchived?: boolean;
}

export const useGetCustomFields = ({ 
  workspaceId,
  spaceId,
  projectId, 
  appliesTo,
  includeArchived = false 
}: UseGetCustomFieldsProps) => {
  const query = useQuery({
    queryKey: ["custom-fields", workspaceId, spaceId, projectId, appliesTo],
    enabled: !!workspaceId,
    queryFn: async () => {
      if (!workspaceId) return null;

      const response = await client.api["custom-fields"].$get({
        query: { 
          workspaceId,
          projectId: projectId || undefined,
          appliesTo: appliesTo || undefined,
          includeArchived: includeArchived ? "true" : undefined,
          spaceId: spaceId || undefined,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch custom fields.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
