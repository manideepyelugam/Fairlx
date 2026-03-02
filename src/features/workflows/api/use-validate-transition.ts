import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.workflows["validate-transition"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.workflows["validate-transition"]["$post"]>;

/**
 * Transition validation result from the workflow API.
 * 
 * Possible reasons for blocked transitions:
 * - TRANSITION_NOT_DEFINED: No transition exists between these statuses in the workflow
 * - TRANSITION_NOT_ALLOWED: Generic transition block (API-level validation)
 * - ROLE_NOT_ALLOWED: User's role cannot perform this transition
 * - TEAM_NOT_ALLOWED: User's team cannot perform this transition
 * - REQUIRES_APPROVAL: Transition needs approval from designated approvers
 * - VALIDATION_ERROR: System error during validation (fail-closed security)
 */
export interface TransitionValidationResult {
  allowed: boolean;
  reason?: 
    | "TRANSITION_NOT_DEFINED"
    | "TRANSITION_NOT_ALLOWED" 
    | "ROLE_NOT_ALLOWED" 
    | "TEAM_NOT_ALLOWED" 
    | "REQUIRES_APPROVAL"
    | "VALIDATION_ERROR";
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
