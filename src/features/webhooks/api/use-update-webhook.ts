import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["project-webhooks"][":webhookId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api["project-webhooks"][":webhookId"]["$patch"]>;

export const useUpdateWebhook = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ param, json }) => {
            const response = await client.api["project-webhooks"][":webhookId"].$patch({
                param,
                json,
            });

            if (!response.ok) {
                throw new Error("Failed to update webhook");
            }

            return await response.json();
        },
        onSuccess: (data, { json }) => {
            toast.success("Webhook updated");
            queryClient.invalidateQueries({ queryKey: ["webhooks", { projectId: json.projectId }] });
            queryClient.invalidateQueries({ queryKey: ["webhook", data.data.$id] });
        },
        onError: () => {
            toast.error("Failed to update webhook");
        },
    });

    return mutation;
};
