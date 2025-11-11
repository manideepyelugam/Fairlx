import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetSubtasksProps {
  workspaceId: string;
  workItemId: string;
}

export const useGetSubtasks = ({ workspaceId, workItemId }: UseGetSubtasksProps) => {
  const query = useQuery({
    queryKey: ["subtasks", workspaceId, workItemId],
    queryFn: async () => {
      const response = await client.api.subtasks.$get({
        query: { workspaceId, workItemId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subtasks");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
