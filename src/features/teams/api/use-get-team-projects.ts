import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetTeamProjectsProps {
  teamId: string;
}

export const useGetTeamProjects = ({ teamId }: UseGetTeamProjectsProps) => {
  const query = useQuery({
    queryKey: ["team-projects", teamId],
    queryFn: async () => {
      const response = await client.api.teams[":teamId"]["projects"]["$get"]({
        param: { teamId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch team projects");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
