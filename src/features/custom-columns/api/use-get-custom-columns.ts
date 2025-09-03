import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetCustomColumnsProps {
  workspaceId: string;
  projectId?: string;
}

export const useGetCustomColumns = ({ workspaceId, projectId }: UseGetCustomColumnsProps) => {
  const query = useQuery({
    queryKey: ["custom-columns", workspaceId, projectId],
    queryFn: async () => {
      const response = await client.api["custom-columns"]["$get"]({
        query: { workspaceId, projectId: projectId || "" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch custom columns");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!workspaceId && !!projectId,
  });

  return query;
};
