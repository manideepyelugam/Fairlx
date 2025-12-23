import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { ResourceType, AlertType } from "../types";

interface CreateUsageAlertParams {
    workspaceId: string;
    resourceType: ResourceType;
    threshold: number;
    alertType: AlertType;
    webhookUrl?: string;
}

export const useCreateUsageAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: CreateUsageAlertParams) => {
            const response = await client.api.usage.alerts.$post({
                json: params,
            });

            if (!response.ok) {
                throw new Error("Failed to create usage alert");
            }

            return await response.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["usage-alerts", variables.workspaceId],
            });
        },
    });
};
