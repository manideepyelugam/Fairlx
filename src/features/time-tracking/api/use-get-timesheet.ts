import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetTimesheetProps {
  workspaceId: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

export const useGetTimesheet = ({ 
  workspaceId, 
  userId, 
  startDate, 
  endDate, 
  projectId 
}: UseGetTimesheetProps) => {
  const query = useQuery({
    queryKey: ["timesheet", workspaceId, userId, startDate, endDate, projectId],
    queryFn: async () => {
      const response = await client.api.timeLogs.timesheet.$get({
        query: {
          workspaceId,
          ...(userId && { userId }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(projectId && { projectId }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch timesheet.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
