import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { InferResponseType } from "hono";

type DashboardResponseType = InferResponseType<typeof client.api.usage.dashboard.$get, 200>;

/**
 * Combined hook for usage dashboard data.
 * Fetches events + summary + alerts in a SINGLE API call instead of 3 separate ones.
 * 
 * WHY: Each individual call was doing session auth + org access check + workspace lookup
 * (~3-5s overhead per call). The combined endpoint does it once and runs data queries in parallel.
 */
export function useGetUsageDashboard(params: {
    workspaceId?: string;
    organizationId?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    eventsLimit?: number;
    eventsOffset?: number;
}) {
    return useQuery<DashboardResponseType>({
        queryKey: ["usage-dashboard", params],
        queryFn: async () => {
            const response = await client.api.usage.dashboard.$get({
                query: {
                    workspaceId: params.workspaceId,
                    organizationId: params.organizationId,
                    period: params.period,
                    startDate: params.startDate,
                    endDate: params.endDate,
                    eventsLimit: params.eventsLimit?.toString(),
                    eventsOffset: params.eventsOffset?.toString(),
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch usage dashboard data");
            }

            return await response.json();
        },
    });
}
