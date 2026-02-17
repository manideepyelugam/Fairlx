import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetWebhookDeliveries = (webhookId: string, projectId: string) => {
    const query = useQuery({
        queryKey: ["webhook-deliveries", webhookId],
        enabled: !!webhookId && !!projectId,
        queryFn: async () => {
            const response = await client.api["project-webhooks"][":webhookId"]["deliveries"].$get({
                param: { webhookId },
                query: { projectId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch webhook deliveries");
            }

            const { data } = await response.json();
            return data;
        },
    });

    return query;
};
