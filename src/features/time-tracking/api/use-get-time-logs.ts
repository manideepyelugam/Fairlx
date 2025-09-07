import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetTimeLogsProps {
  workspaceId: string;
  taskId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

export const useGetTimeLogs = ({ 
  workspaceId, 
  taskId, 
  userId, 
  startDate, 
  endDate, 
  projectId 
}: UseGetTimeLogsProps) => {
  const query = useQuery({
    queryKey: ["time-logs", workspaceId, taskId, userId, startDate, endDate, projectId],
    queryFn: async () => {
      const response = await client.api.timeLogs.$get({
        query: {
          workspaceId,
          ...(taskId && { taskId }),
          ...(userId && { userId }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(projectId && { projectId }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch time logs.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
