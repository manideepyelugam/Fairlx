import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetSpacesProps {
  workspaceId?: string;
}

export const useGetSpaces = ({ workspaceId }: UseGetSpacesProps) => {
  const query = useQuery({
    queryKey: ["spaces", workspaceId],
    enabled: !!workspaceId,
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
