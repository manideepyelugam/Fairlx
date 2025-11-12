import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetTeamMembersProps {
  teamId: string | null;
}

export const useGetTeamMembers = ({ teamId }: UseGetTeamMembersProps) => {
  const query = useQuery({
    queryKey: ["team-members", teamId],
    enabled: Boolean(teamId),
    queryFn: async () => {
      if (!teamId) {
        throw new Error("teamId is required to fetch team members.");
      }

      const response = await client.api.teams[":teamId"].members.$get({
        param: { teamId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch team members.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
