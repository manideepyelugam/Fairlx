import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetEstimatesVsActualsProps {
  workspaceId: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export const useGetEstimatesVsActuals = ({ 
  workspaceId, 
  projectId, 
  startDate, 
  endDate 
}: UseGetEstimatesVsActualsProps) => {
  const query = useQuery({
    queryKey: ["estimates-vs-actuals", workspaceId, projectId, startDate, endDate],
    queryFn: async () => {
      const response = await client.api.timeLogs["estimates-vs-actuals"].$get({
        query: {
          workspaceId,
          ...(projectId && { projectId }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch estimates vs actuals.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
