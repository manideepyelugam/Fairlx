import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { ProgramAnalytics } from "../types";

interface UseGetProgramAnalyticsProps {
  programId: string;
  dateRange?: "7d" | "30d" | "90d" | "all";
}

interface GetProgramAnalyticsResponse {
  data: ProgramAnalytics;
}

export const useGetProgramAnalytics = ({ 
  programId, 
  dateRange = "30d" 
}: UseGetProgramAnalyticsProps) => {
  const query = useQuery({
    queryKey: ["program-analytics", programId, dateRange],
    enabled: Boolean(programId),
    queryFn: async (): Promise<GetProgramAnalyticsResponse> => {
      if (!programId) {
        throw new Error("Program ID is required");
      }

      const response = await client.api.programs[":programId"].analytics.$get({
        param: { programId },
        query: { dateRange },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program analytics");
      }

      return await response.json();
    },
    // Analytics data doesn't need to update frequently
    staleTime: 60 * 1000, // 1 minute
  });

  return query;
};
