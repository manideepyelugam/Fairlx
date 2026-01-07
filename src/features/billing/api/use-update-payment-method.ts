import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.billing["payment-method"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.billing["payment-method"]["$post"]>["json"];

/**
 * Hook to update payment method after Razorpay checkout
 */
export function useUpdatePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.billing["payment-method"].$post({ json });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = (errorData as { error?: string }).error || JSON.stringify(errorData) || "Failed to update payment method";
                throw new Error(errorMessage);
            }

            return response.json();
        },
        onSuccess: (data) => {
            // Invalidate billing queries to refresh status
            queryClient.invalidateQueries({ queryKey: ["billing-account"] });
            queryClient.invalidateQueries({ queryKey: ["billing-status"] });

            // Check if account was restored from suspension
            if ("restored" in data && data.restored) {
                toast.success("Account restored! Full access has been reinstated.");
            } else {
                toast.success("Payment method updated successfully");
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
}
