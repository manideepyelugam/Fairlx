import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetUsageAlertsParams {
    workspaceId: string;
}

export const useGetUsageAlerts = (params: UseGetUsageAlertsParams) => {
    return useQuery({
        queryKey: ["usage-alerts", params.workspaceId],
        queryFn: async () => {
            const response = await client.api.usage.alerts.$get({
                query: {
                    workspaceId: params.workspaceId,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch usage alerts");
            }

            return await response.json();
        },
        enabled: !!params.workspaceId,
    });
};
