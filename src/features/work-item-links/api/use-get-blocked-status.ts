import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetBlockedStatusProps {
  workItemId: string;
  enabled?: boolean;
}

export const useGetBlockedStatus = ({ workItemId, enabled = true }: UseGetBlockedStatusProps) => {
  const query = useQuery({
    queryKey: ["blocked-status", workItemId],
    enabled: enabled && !!workItemId,
    queryFn: async () => {
      const response = await client.api["work-item-links"]["blocked-status"][":workItemId"].$get({
        param: { workItemId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blocked status.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
