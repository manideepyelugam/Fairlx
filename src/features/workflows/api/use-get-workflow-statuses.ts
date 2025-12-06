import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetWorkflowStatusesProps {
  workflowId: string;
}

export const useGetWorkflowStatuses = ({ workflowId }: UseGetWorkflowStatusesProps) => {
  const query = useQuery({
    queryKey: ["workflow-statuses", workflowId],
    enabled: !!workflowId,
    queryFn: async () => {
      const response = await client.api.workflows[":workflowId"]["statuses"].$get({
        param: { workflowId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workflow statuses.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
