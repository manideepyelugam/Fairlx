import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { QUERY_CONFIG } from "@/lib/query-config";

interface UseGetSpacesProps {
  workspaceId?: string;
}

export const useGetSpaces = ({ workspaceId }: UseGetSpacesProps) => {
  const query = useQuery({
    queryKey: ["spaces", workspaceId],
    enabled: !!workspaceId,
    staleTime: QUERY_CONFIG.STATIC.staleTime,
    gcTime: QUERY_CONFIG.STATIC.gcTime,
    queryFn: async () => {
      if (!workspaceId) return null;

      const response = await client.api.spaces.$get({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch spaces.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
