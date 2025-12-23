import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface DeleteUsageAlertParams {
    alertId: string;
    workspaceId: string;
}

export const useDeleteUsageAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ alertId }: DeleteUsageAlertParams) => {
            const response = await client.api.usage.alerts[":alertId"].$delete({
                param: { alertId },
            });

            if (!response.ok) {
                throw new Error("Failed to delete usage alert");
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
