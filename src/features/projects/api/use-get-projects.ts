import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { QUERY_CONFIG } from "@/lib/query-config";

interface UseGetProjectsProps {
  // Optional so we can safely use the hook in layouts / sidebars that may
  // render outside of a specific workspace context.
  workspaceId?: string;
}

export const useGetProjects = ({ workspaceId }: UseGetProjectsProps) => {
  const query = useQuery({
    queryKey: ["projects", workspaceId],
    enabled: !!workspaceId, // prevent 400 (Bad Request) when workspaceId is missing
    staleTime: QUERY_CONFIG.STATIC.staleTime,
    gcTime: QUERY_CONFIG.STATIC.gcTime,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!workspaceId) return null; // Should never run when disabled, but defensive

      const response = await client.api.projects.$get({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
