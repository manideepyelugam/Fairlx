import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { ResourceType, UsageSource } from "../types";

interface UseGetUsageEventsParams {
    workspaceId: string;
    projectId?: string;
    resourceType?: ResourceType;
    source?: UsageSource;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export const useGetUsageEvents = (params: UseGetUsageEventsParams) => {
    return useQuery({
        queryKey: ["usage-events", params],
        queryFn: async () => {
            const response = await client.api.usage.events.$get({
                query: {
                    workspaceId: params.workspaceId,
                    projectId: params.projectId,
                    resourceType: params.resourceType,
                    source: params.source,
                    startDate: params.startDate,
                    endDate: params.endDate,
                    limit: params.limit?.toString() || "50",
                    offset: params.offset?.toString() || "0",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch usage events");
            }

            return await response.json();
        },
        enabled: !!params.workspaceId,
    });
};
