import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { BacklogItemStatus, BacklogItemPriority, BacklogItemType } from "../types";

interface UseGetBacklogItemsProps {
  workspaceId: string;
  status?: BacklogItemStatus | null;
  priority?: BacklogItemPriority | null;
  type?: BacklogItemType | null;
  search?: string | null;
}

export const useGetBacklogItems = ({
  workspaceId,
  status,
  priority,
  type,
  search,
}: UseGetBacklogItemsProps) => {
  const query = useQuery({
    queryKey: ["personal-backlog", workspaceId, { status, priority, type, search }],
    queryFn: async () => {
      const response = await client.api["personal-backlog"].$get({
        query: {
          workspaceId,
          status: status ?? undefined,
          priority: priority ?? undefined,
          type: type ?? undefined,
          search: search ?? undefined,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch backlog items");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
