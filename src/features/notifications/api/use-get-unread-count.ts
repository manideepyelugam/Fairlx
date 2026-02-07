import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetUnreadCountProps {
  workspaceId: string;
  enabled?: boolean;
}

export const useGetUnreadCount = ({ workspaceId, enabled = true }: UseGetUnreadCountProps) => {
  const query = useQuery({
    queryKey: ["notifications", "unread-count", workspaceId],
    queryFn: async () => {
      const response = await client.api.notifications["unread-count"].$get({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: enabled && Boolean(workspaceId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: enabled ? 3 * 60 * 1000 : false, // Refetch every 3 minutes (was 60s)
    refetchIntervalInBackground: false, // Don't refetch when window is not focused
  });

  return query;
};

