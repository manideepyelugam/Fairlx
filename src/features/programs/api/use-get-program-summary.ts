import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetProgramSummaryProps {
  programId: string;
}

interface ProgramSummary {
  projectCount: number;
  memberCount: number;
  milestoneCount: number;
  completedMilestoneCount: number;
}

interface GetProgramSummaryResponse {
  data: ProgramSummary;
}

export type { GetProgramSummaryResponse, ProgramSummary };

export const useGetProgramSummary = ({ programId }: UseGetProgramSummaryProps) => {
  const query = useQuery({
    queryKey: ["program-summary", programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<GetProgramSummaryResponse> => {
      if (!programId) {
        throw new Error("Program ID is required");
      }

      const response = await client.api.programs[":programId"].analytics.summary.$get({
        param: { programId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program summary");
      }

      return await response.json();
    },
    // Summary data is relatively static
    staleTime: 30 * 1000, // 30 seconds
  });

  return query;
};
