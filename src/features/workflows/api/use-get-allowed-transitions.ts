import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetAllowedTransitionsProps {
  workflowId: string;
  fromStatusId: string;
  enabled?: boolean;
}

interface AllowedTransition {
  $id: string;
  workflowId: string;
  fromStatusId: string;
  toStatusId: string;
  name?: string | null;
  description?: string | null;
  allowedTeamIds?: string[] | null;
  allowedMemberRoles?: string[] | null;
  requiresApproval: boolean;
  approverTeamIds?: string[] | null;
  toStatus?: {
    $id: string;
    name: string;
    key: string;
    icon: string;
    color: string;
    statusType: string;
  };
}

export const useGetAllowedTransitions = ({ 
  workflowId, 
  fromStatusId,
  enabled = true,
}: UseGetAllowedTransitionsProps) => {
  const query = useQuery<AllowedTransition[]>({
    queryKey: ["allowed-transitions", workflowId, fromStatusId],
    enabled: enabled && !!workflowId && !!fromStatusId,
    queryFn: async () => {
      const response = await client.api.workflows["allowed-transitions"].$get({
        query: { workflowId, fromStatusId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch allowed transitions.");
      }

      const { data } = await response.json();
      return data as AllowedTransition[];
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  return query;
};
