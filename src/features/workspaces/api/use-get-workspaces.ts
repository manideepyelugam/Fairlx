import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { QUERY_CONFIG } from "@/lib/query-config";

export const useGetWorkspaces = () => {
  const query = useQuery({
    queryKey: ["workspaces"],
    staleTime: QUERY_CONFIG.STATIC.staleTime,
    gcTime: QUERY_CONFIG.STATIC.gcTime,
    queryFn: async () => {
      const response = await client.api.workspaces.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch workspaces.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
