import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.billing.setup.$post>;
type RequestType = InferRequestType<typeof client.api.billing.setup.$post>;

export const useSetupBilling = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.billing.setup.$post({ json });

            if (!response.ok) {
                // Clone the response so we can read it multiple times if needed (e.g. for text fallback)
                const errorResponse = response.clone();
                let errorMessage = "Failed to setup billing";
                try {
                    const errorData = await errorResponse.json();

                    if (typeof errorData === 'object' && errorData !== null) {
                        // Handle Zod validation errors
                        if ('error' in errorData) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const err = (errorData as any).error;
                            if (typeof err === 'string') errorMessage = err;
                            else if (typeof err === 'object') errorMessage = JSON.stringify(err);
                        }
                        // Handle Hono validation errors
                        else if ('success' in errorData && errorData.success === false) {
                            errorMessage = JSON.stringify(errorData);
                        }
                        else {
                            errorMessage = JSON.stringify(errorData);
                        }
                    } else {
                        errorMessage = String(errorData);
                    }
                } catch {
                    // Fallback if response is not JSON
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-account"] });
            queryClient.invalidateQueries({ queryKey: ["billing-status"] });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            // Don't show generic error if we have a specific one
            const message = error instanceof Error ?
                (error.message.startsWith("{") ? "Validation failed" : error.message) :
                "Unknown error";
            toast.error(message || "Failed to setup billing");
        },
    });

    return mutation;
};
