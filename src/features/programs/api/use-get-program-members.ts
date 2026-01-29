import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { PopulatedProgramMember } from "../types";

interface UseGetProgramMembersProps {
  programId: string;
}

interface GetProgramMembersResponse {
  data: {
    documents: PopulatedProgramMember[];
    total: number;
  };
}

export const useGetProgramMembers = ({ programId }: UseGetProgramMembersProps) => {
  const query = useQuery({
    queryKey: ["program-members", programId],
    enabled: Boolean(programId),
    queryFn: async (): Promise<GetProgramMembersResponse> => {
      if (!programId) {
        throw new Error("Program ID is required");
      }

      const response = await client.api.programs[":programId"].members.$get({
        param: { programId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program members");
      }

      return await response.json();
    },
  });

  return query;
};
