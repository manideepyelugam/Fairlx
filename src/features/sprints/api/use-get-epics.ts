import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetEpicsProps {
  workspaceId: string;
  projectId?: string;
}

export const useGetEpics = ({ workspaceId, projectId }: UseGetEpicsProps) => {
  const query = useQuery({
    queryKey: ["epics", workspaceId, projectId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error("workspaceId is required to fetch epics.");
      }

      const response = await client.api["work-items"]["epics"].$get({
        query: {
          workspaceId,
          projectId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch epics.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
