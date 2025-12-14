import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
    (typeof client.api.projects)[":projectId"]["copy-settings"]["$post"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.projects)[":projectId"]["copy-settings"]["$post"]
>;

export const useCopyProjectSettings = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ param, json }) => {
            const response = await client.api.projects[":projectId"]["copy-settings"]["$post"]({
                param,
                json,
            });

            if (!response.ok) {
                throw new Error("Failed to copy settings");
            }

            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success("Settings copied successfully");

            queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
        onError: () => {
            toast.error("Failed to copy settings");
        },
    });

    return mutation;
};
