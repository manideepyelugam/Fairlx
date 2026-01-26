import { useQuery } from "@tanstack/react-query";



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

      /* Legacy route removed */
      // const response = await client.api.programs[":programId"].teams.$get({
      //   param: { programId },
      // });
      return { documents: [], total: 0 };
    },
  });

  return query;
};
