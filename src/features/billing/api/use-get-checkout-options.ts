import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { RazorpayCheckoutOptions } from "../types";

interface UseGetCheckoutOptionsParams {
    userId?: string;
    organizationId?: string;
    /** Phone number - REQUIRED for Razorpay recurring payments */
    phone?: string;
    enabled?: boolean;
}

interface CheckoutOptionsResponse {
    data: RazorpayCheckoutOptions;
}

/**
 * Hook to get Razorpay checkout options for mandate authorization
 * 
 * IMPORTANT: phone is required for recurring payments.
 * Call this with a valid phone before opening the payment checkout dialog.
 */
export function useGetCheckoutOptions(options: UseGetCheckoutOptionsParams = {}) {
    const { userId, organizationId, phone, enabled = true } = options;

    // Don't enable query if phone is missing (required for recurring)
    const isEnabled = enabled && Boolean(phone);

    return useQuery<CheckoutOptionsResponse>({
        queryKey: ["billing-checkout-options", { userId, organizationId, phone }],
        queryFn: async () => {
            if (!phone) {
                throw new Error("Phone number is required for auto-debit setup");
            }

            const params = { phone } as { phone: string; userId?: string; organizationId?: string };
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
        enabled: isEnabled,
        // Don't cache - always get fresh order ID
        staleTime: 0,
    });
}

