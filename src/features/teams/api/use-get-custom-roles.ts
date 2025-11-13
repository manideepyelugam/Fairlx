import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetCustomRolesProps {
  teamId: string;
}

export const useGetCustomRoles = ({ teamId }: UseGetCustomRolesProps) => {
  const query = useQuery({
    queryKey: ["custom-roles", teamId],
    queryFn: async () => {
      const response = await client.api.teams[":teamId"]["custom-roles"].$get({
        param: { teamId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch custom roles");
      }

      const data = await response.json();
      return data;
    },
  });

  return query;
};
