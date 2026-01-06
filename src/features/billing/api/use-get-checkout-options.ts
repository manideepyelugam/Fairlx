import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { RazorpayCheckoutOptions } from "../types";

interface UseGetCheckoutOptionsParams {
    userId?: string;
    organizationId?: string;
    enabled?: boolean;
}

interface CheckoutOptionsResponse {
    data: RazorpayCheckoutOptions;
}

/**
 * Hook to get Razorpay checkout options
 * Call this before opening the payment checkout dialog
 */
export function useGetCheckoutOptions(options: UseGetCheckoutOptionsParams = {}) {
    const { userId, organizationId, enabled = true } = options;

    return useQuery<CheckoutOptionsResponse>({
        queryKey: ["billing-checkout-options", { userId, organizationId }],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (userId) params.userId = userId;
            if (organizationId) params.organizationId = organizationId;

            const response = await client.api.billing["checkout-options"].$get({
                query: params,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error((errorData as { error?: string }).error || "Failed to get checkout options");
            }

            return response.json() as Promise<CheckoutOptionsResponse>;
        },
        enabled,
        // Don't cache - always get fresh subscription ID
        staleTime: 0,
    });
}
