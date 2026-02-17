import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["project-webhooks"][":webhookId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api["project-webhooks"][":webhookId"]["$delete"]>;

export const useDeleteWebhook = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ param, query }) => {
            const response = await client.api["project-webhooks"][":webhookId"].$delete({
                param,
                query,
            });

            if (!response.ok) {
                throw new Error("Failed to delete webhook");
            }

            return await response.json();
        },
        onSuccess: (_, { query }) => {
            toast.success("Webhook deleted");
            queryClient.invalidateQueries({ queryKey: ["webhooks", { projectId: query.projectId }] });
        },
        onError: () => {
            toast.error("Failed to delete webhook");
        },
    });

    return mutation;
};
