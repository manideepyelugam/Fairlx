import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { AlertType } from "../types";

interface UpdateUsageAlertParams {
    alertId: string;
    workspaceId: string;
    threshold?: number;
    alertType?: AlertType;
    isEnabled?: boolean;
    webhookUrl?: string | null;
}

export const useUpdateUsageAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ alertId, ...params }: UpdateUsageAlertParams) => {
            const response = await client.api.usage.alerts[":alertId"].$patch({
                param: { alertId },
                json: params,
            });

            if (!response.ok) {
                throw new Error("Failed to update usage alert");
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
