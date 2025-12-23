import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetUsageSummaryParams {
    workspaceId: string;
    period?: string;
}

export const useGetUsageSummary = (params: UseGetUsageSummaryParams) => {
    return useQuery({
        queryKey: ["usage-summary", params],
        queryFn: async () => {
            const response = await client.api.usage.summary.$get({
                query: {
                    workspaceId: params.workspaceId,
                    period: params.period,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch usage summary");
            }

            return await response.json();
        },
        enabled: !!params.workspaceId,
    });
};
