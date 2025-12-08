import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetSavedViewsProps {
  workspaceId?: string;
  projectId?: string;
  viewType?: string;
  includeShared?: boolean;
}

export const useGetSavedViews = ({ 
  workspaceId, 
  projectId, 
  viewType,
  includeShared = true 
}: UseGetSavedViewsProps) => {
  const query = useQuery({
    queryKey: ["saved-views", workspaceId, projectId, viewType],
    enabled: !!workspaceId,
    queryFn: async () => {
      if (!workspaceId) return null;

      const response = await client.api["saved-views"].$get({
        query: { 
          workspaceId,
          projectId: projectId || undefined,
          viewType: viewType || undefined,
          includeShared: includeShared ? "true" : undefined,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch saved views.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
