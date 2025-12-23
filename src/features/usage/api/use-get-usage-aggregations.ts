import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetUsageAggregationsParams {
    workspaceId: string;
    startPeriod?: string;
    endPeriod?: string;
}

export const useGetUsageAggregations = (params: UseGetUsageAggregationsParams) => {
    return useQuery({
        queryKey: ["usage-aggregations", params],
        queryFn: async () => {
            const response = await client.api.usage.aggregations.$get({
                query: {
                    workspaceId: params.workspaceId,
                    startPeriod: params.startPeriod,
                    endPeriod: params.endPeriod,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch usage aggregations");
            }

            return await response.json();
        },
        enabled: !!params.workspaceId,
    });
};
