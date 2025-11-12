import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetProgramTeamsProps {
  programId: string;
}

export const useGetProgramTeams = ({ programId }: UseGetProgramTeamsProps) => {
  const query = useQuery({
    queryKey: ["program-teams", programId],
    enabled: Boolean(programId),
    queryFn: async () => {
      if (!programId) {
        throw new Error("programId is required to fetch program teams.");
      }

      const response = await client.api.programs[":programId"].teams.$get({
        param: { programId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program teams.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
