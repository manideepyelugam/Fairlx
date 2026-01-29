import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { ProgramMilestone } from "../types";

interface UseGetProgramMilestonesProps {
  programId: string;
}

interface GetProgramMilestonesResponse {
  data: {
    documents: ProgramMilestone[];
    total: number;
  };
}

export type { GetProgramMilestonesResponse };

export const useGetProgramMilestones = ({ programId }: UseGetProgramMilestonesProps) => {
  const query = useQuery({
    queryKey: ["program-milestones", programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<GetProgramMilestonesResponse> => {
      if (!programId) {
        throw new Error("Program ID is required");
      }

      const response = await client.api.programs[":programId"].milestones.$get({
        param: { programId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program milestones");
      }

      return await response.json();
    },
  });

  return query;
};
