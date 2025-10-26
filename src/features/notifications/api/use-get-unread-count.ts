import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetUnreadCountProps {
  workspaceId: string;
}

export const useGetUnreadCount = ({ workspaceId }: UseGetUnreadCountProps) => {
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
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching even when window is not focused
  });

  return query;
};
