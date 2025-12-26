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
    refetchInterval: enabled ? 30000 : false, // Refetch every 30 seconds when enabled
    refetchIntervalInBackground: true, // Continue refetching even when window is not focused
  });

  return query;
};

