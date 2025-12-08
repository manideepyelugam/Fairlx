import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetWorkflowProps {
  workflowId: string;
}

export const useGetWorkflow = ({ workflowId }: UseGetWorkflowProps) => {
  const query = useQuery({
    queryKey: ["workflow", workflowId],
    enabled: !!workflowId,
    queryFn: async () => {
      const response = await client.api.workflows[":workflowId"].$get({
        param: { workflowId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workflow.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
