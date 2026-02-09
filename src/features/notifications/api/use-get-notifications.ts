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
    staleTime: 3 * 60 * 1000, // 3 minutes — notifications aren't urgent enough for 60s polling
    refetchInterval: enabled ? 3 * 60 * 1000 : false, // Refetch every 3 minutes (was 60s)
    refetchIntervalInBackground: false, // Don't refetch when window is not focused
  });

  return query;
};

