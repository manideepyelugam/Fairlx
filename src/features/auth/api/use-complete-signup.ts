import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
    (typeof client.api.auth)["complete-signup"]["$post"]
>;

/**
 * Hook to complete signup by creating workspace/organization
 * 
 * WHY: After email verification and first login, we need to create
 * the user's workspace (PERSONAL) or organization + workspace (ORG)
 * based on the account type selected during registration.
 * 
 * This is idempotent - calling multiple times won't create duplicates.
 */
export const useCompleteSignup = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error>({
        mutationFn: async () => {
            const response = await client.api.auth["complete-signup"].$post();
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData));
            }
            return await response.json();
        },
        onSuccess: () => {
            // Invalidate workspaces query to show the new workspace
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["current"] });
        },
        onError: (error) => {
            console.error("[CompleteSignup] Error:", error);
        },
    });

    return mutation;
};
