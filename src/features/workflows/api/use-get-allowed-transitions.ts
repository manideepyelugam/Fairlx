import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetAllowedTransitionsProps {
  workflowId: string;
  fromStatusId: string;
}

export const useGetAllowedTransitions = ({ 
  workflowId, 
  fromStatusId 
}: UseGetAllowedTransitionsProps) => {
  const query = useQuery({
    queryKey: ["allowed-transitions", workflowId, fromStatusId],
    enabled: !!workflowId && !!fromStatusId,
    queryFn: async () => {
      // TODO: Implement allowed transitions endpoint
      const response = await client.api.workflows[":workflowId"]["transitions"].$get({
        param: { workflowId },
      }) as Response;

      if (!response.ok) {
        throw new Error("Failed to fetch allowed transitions.");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
