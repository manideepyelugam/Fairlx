import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { PopulatedComment } from "../types";

interface UseGetCommentsProps {
  taskId: string;
  workspaceId: string;
}

export const useGetComments = ({ taskId, workspaceId }: UseGetCommentsProps) => {
  const query = useQuery({
    queryKey: ["comments", taskId, workspaceId],
    queryFn: async () => {
      const response = await client.api.comments["$get"]({
        query: { taskId, workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const { data } = (await response.json()) as { data: PopulatedComment[] };
      return data;
    },
    enabled: !!taskId && !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    // REMOVED refetchInterval — comments should NOT auto-poll.
    // Use Appwrite Realtime or manual refresh instead.
    // Was doing 1 DB read every 60s for EVERY open task detail view.
    refetchOnWindowFocus: false,
  });

  return query;
};
