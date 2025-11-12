import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetTeamProps {
  teamId: string | null;
}

export const useGetTeam = ({ teamId }: UseGetTeamProps) => {
  const query = useQuery({
    queryKey: ["teams", teamId],
    enabled: Boolean(teamId),
    queryFn: async () => {
      if (!teamId) {
        throw new Error("teamId is required to fetch team.");
      }

      const response = await client.api.teams[":teamId"].$get({
        param: { teamId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch team.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
