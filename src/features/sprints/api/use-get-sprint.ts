import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetSprintProps {
  sprintId: string;
}

export const useGetSprint = ({ sprintId }: UseGetSprintProps) => {
  const query = useQuery({
    queryKey: ["sprint", sprintId],
    enabled: Boolean(sprintId),
    queryFn: async () => {
      if (!sprintId) {
        throw new Error("sprintId is required to fetch sprint.");
      }

      const response = await client.api.sprints[":sprintId"].$get({
        param: { sprintId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sprint.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
