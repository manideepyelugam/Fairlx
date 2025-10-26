import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetNotificationsProps {
  workspaceId: string;
  limit?: number;
  unreadOnly?: boolean;
}

export const useGetNotifications = ({
  workspaceId,
  limit = 50,
  unreadOnly = false,
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
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching even when window is not focused
  });

  return query;
};
