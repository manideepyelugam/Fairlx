import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetCustomColumnsProps {
  workspaceId: string;
  projectId?: string;
  workflowId?: string;
}

export const useGetCustomColumns = ({ workspaceId, projectId, workflowId }: UseGetCustomColumnsProps) => {
  const query = useQuery({
    queryKey: ["custom-columns", workspaceId, projectId, workflowId],
    queryFn: async () => {
      const response = await client.api["custom-columns"]["$get"]({
        query: { 
          workspaceId, 
          projectId: projectId || "", 
          workflowId: workflowId || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch custom columns");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!workspaceId && (!!projectId || !!workflowId),
  });

  return query;
};
