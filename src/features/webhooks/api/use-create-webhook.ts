import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["project-webhooks"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api["project-webhooks"]["$post"]>;

export const useCreateWebhook = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api["project-webhooks"].$post({ json });

            if (!response.ok) {
                throw new Error("Failed to create webhook");
            }

            return await response.json();
        },
        onSuccess: (_, { json }) => {
            toast.success("Webhook created");
            queryClient.invalidateQueries({ queryKey: ["webhooks", { projectId: json.projectId }] });
        },
        onError: () => {
            toast.error("Failed to create webhook");
        },
    });

    return mutation;
};
