import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.workflows["validate-transition"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.workflows["validate-transition"]["$post"]>;

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: "TRANSITION_NOT_ALLOWED" | "ROLE_NOT_ALLOWED" | "TEAM_NOT_ALLOWED" | "REQUIRES_APPROVAL";
  message?: string;
  approverTeamIds?: string[];
  transition?: {
    $id: string;
    name?: string | null;
    requiresApproval?: boolean;
  };
}

export const useValidateTransition = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.workflows["validate-transition"].$post({ json });

      if (!response.ok) {
        throw new Error("Failed to validate transition.");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["allowed-transitions"] });
    },
  });

  return mutation;
};
