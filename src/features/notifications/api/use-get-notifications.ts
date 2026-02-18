import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetNotificationsProps {
  workspaceId: string;
  limit?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
}

export const useGetNotifications = ({
  workspaceId,
  limit = 50,
  unreadOnly = false,
  enabled = true,
}: UseGetNotificationsProps) => {
  const query = useQuery({
    queryKey: ["notifications", workspaceId, limit, unreadOnly],
    queryFn: async () => {
      const response = await client.api.notifications.$get({
        query: {
          workspaceId,
          limit: limit.toString(),
          unreadOnly: unreadOnly.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: enabled && Boolean(workspaceId),
    staleTime: 15 * 60 * 1000, // 15 minutes — notifications aren't urgent with real-time sockets
    refetchInterval: enabled ? 15 * 60 * 1000 : false, // Refetch every 15 minutes
    refetchIntervalInBackground: false,
    retry: false, // Don't spam retries on failure (especially 401s)
  });

  return query;
};

