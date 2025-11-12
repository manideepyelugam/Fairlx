import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetProgramProps {
  programId: string;
}

export const useGetProgram = ({ programId }: UseGetProgramProps) => {
  const query = useQuery({
    queryKey: ["programs", programId],
    enabled: Boolean(programId),
    queryFn: async () => {
      if (!programId) {
        throw new Error("programId is required to fetch program.");
      }

      const response = await client.api.programs[":programId"].$get({
        param: { programId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch program.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
