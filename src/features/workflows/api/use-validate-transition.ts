import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseValidateTransitionProps {
  workflowId: string;
  fromStatusId: string;
  toStatusId: string;
  enabled?: boolean;
}

export const useValidateTransition = ({ 
  workflowId, 
  fromStatusId, 
  toStatusId, 
  enabled = true 
}: UseValidateTransitionProps) => {
  const query = useQuery({
    queryKey: ["validate-transition", workflowId, fromStatusId, toStatusId],
    enabled: enabled && !!workflowId && !!fromStatusId && !!toStatusId,
    queryFn: async () => {
      // TODO: Implement validate transition endpoint
      const response = await client.api.workflows[":workflowId"]["transitions"].$post({
        param: { workflowId },
        json: { fromStatusId, toStatusId },
      }) as Response;

      if (!response.ok) {
        throw new Error("Failed to validate transition.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
