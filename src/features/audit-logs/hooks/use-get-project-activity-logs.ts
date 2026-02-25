import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface useGetProjectActivityLogsProps {
  workspaceId: string;
  projectId: string;
  limit?: number;
  enabled?: boolean;
}

export const useGetProjectActivityLogs = ({
  workspaceId,
  projectId,
  limit = 10,
}: useGetProjectActivityLogsProps) => {
  const query = useInfiniteQuery({
    queryKey: ["activity-logs", workspaceId, projectId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const response = await client.api["audit-logs"]["$get"]({
        query: {
          workspaceId,
          projectId,
          limit: limit.toString(),
          cursor: pageParam,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }

      const data = await response.json();
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return query;
};

// Hook for getting recent activity logs (for widget)
export const useGetRecentProjectActivityLogs = ({
  workspaceId,
  projectId,
  limit = 5,
  enabled,
}: useGetProjectActivityLogsProps) => {
  const query = useQuery({
    queryKey: ["activity-logs", "recent", workspaceId, projectId, limit],
    queryFn: async () => {
      const response = await client.api["audit-logs"]["$get"]({
        query: {
          workspaceId,
          projectId,
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }

      const data = await response.json();
      return data;
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds for widget
  });

  return query;
};
