import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export interface UseGetWorkItemLinksProps {
  workItemId: string;
  direction?: "outgoing" | "incoming" | "both";
}

export const useGetWorkItemLinks = ({ workItemId, direction = "both" }: UseGetWorkItemLinksProps) => {
  const query = useQuery({
    queryKey: ["work-item-links", workItemId, direction],
    enabled: !!workItemId,
    queryFn: async () => {
      const response = await client.api["work-item-links"].$get({
        query: { 
          workItemId,
          direction,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch work item links.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
