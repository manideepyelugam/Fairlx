import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["project-webhooks"][":webhookId"]["test"]["$post"]>;
type RequestType = InferRequestType<typeof client.api["project-webhooks"][":webhookId"]["test"]["$post"]>;

export const useTestWebhook = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async ({ param, json }) => {
            const response = await client.api["project-webhooks"][":webhookId"]["test"]["$post"]({
                param,
                json,
            });

            if (!response.ok) {
                throw new Error("Failed to test webhook");
            }

            return await response.json();
        },
        onSuccess: (_data, { param }) => {
            toast.success("Test event dispatched");
            queryClient.invalidateQueries({ queryKey: ["webhook-deliveries", param.webhookId] });
            queryClient.invalidateQueries({ queryKey: ["webhooks"] });
        },
        onError: () => {
            toast.error("Failed to dispatch test event");
        },
    });

    return mutation;
};
