import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { BillingStatus } from "../types";

interface UseGetBillingStatusOptions {
    userId?: string;
    organizationId?: string;
    enabled?: boolean;
}

interface BillingStatusResponse {
    status: BillingStatus;
    needsSetup: boolean;
    hasPaymentMethod: boolean;
    daysUntilSuspension?: number;
    gracePeriodEnd?: string;
}

/**
 * Hook to quickly check billing status
 * Use this for lightweight status checks (e.g., for showing warning banners)
 */
export function useGetBillingStatus(options: UseGetBillingStatusOptions = {}) {
    const { userId, organizationId, enabled = true } = options;

    return useQuery<BillingStatusResponse>({
        queryKey: ["billing-status", { userId, organizationId }],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (userId) params.userId = userId;
            if (organizationId) params.organizationId = organizationId;

            const response = await client.api.billing.status.$get({
                query: params,
            });

            if (!response.ok) {
                throw new Error("Failed to fetch billing status");
            }

            return response.json() as Promise<BillingStatusResponse>;
        },
        enabled,
        // Billing status almost never changes — 30 min is sufficient
        staleTime: 30 * 60 * 1000, // 30 minutes
        refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes (was 5 min)
    });
}
