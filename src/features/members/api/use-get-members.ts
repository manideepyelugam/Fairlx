import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { QUERY_CONFIG } from "@/lib/query-config";

interface useGetMembersProps {
  workspaceId: string;
}

export const useGetMembers = ({ workspaceId }: useGetMembersProps) => {
  const query = useQuery({
    queryKey: ["members", workspaceId],
    staleTime: QUERY_CONFIG.SEMI_DYNAMIC.staleTime,
    gcTime: QUERY_CONFIG.SEMI_DYNAMIC.gcTime,
    queryFn: async () => {
      const response = await client.api.members.$get({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch members.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
