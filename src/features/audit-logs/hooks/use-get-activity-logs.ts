import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { ActivityType } from "../types";

interface UseGetActivityLogsProps {
  workspaceId: string;
  projectId?: string;
  userId?: string;
  type?: ActivityType;
  action?: "created" | "updated" | "deleted";
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const useGetActivityLogs = ({
  workspaceId,
  projectId,
  userId,
  type,
  action,
  startDate,
  endDate,
  limit = 50,
}: UseGetActivityLogsProps) => {
  const query = useInfiniteQuery({
    queryKey: [
      "activity-logs",
      workspaceId,
      projectId,
      userId,
      type,
      action,
      startDate,
      endDate,
      limit,
    ],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const response = await client.api["audit-logs"].$get({
        query: {
          workspaceId,
          projectId,
          userId,
          type,
          action,
          startDate,
          endDate,
          limit: limit?.toString(),
          cursor: pageParam,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }

      const { data, nextCursor, hasMore } = await response.json();
      return { data, nextCursor, hasMore };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled: !!workspaceId, // Only run query if workspaceId exists
  });

  return query;
};

interface UseGetActivityStatsProps {
  workspaceId: string;
  startDate?: string;
  endDate?: string;
}

export const useGetActivityStats = ({
  workspaceId,
  startDate,
  endDate,
}: UseGetActivityStatsProps) => {
  const query = useQuery({
    queryKey: ["activity-stats", workspaceId, startDate, endDate],
    queryFn: async () => {
      const response = await client.api["audit-logs"].stats.$get({
        query: {
          workspaceId,
          startDate,
          endDate,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity statistics");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!workspaceId, // Only run query if workspaceId exists
  });

  return query;
};
