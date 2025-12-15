import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
    (typeof client.api)["work-items"]["bulk-delete"]["$post"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api)["work-items"]["bulk-delete"]["$post"]
>["json"];

export const useBulkDeleteWorkItems = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api["work-items"]["bulk-delete"].$post({
                json,
            });

            if (!response.ok) {
                throw new Error("Failed to delete work items");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Work items deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["work-items"] });
            queryClient.invalidateQueries({ queryKey: ["sprints"] });
        },
        onError: () => {
            toast.error("Failed to delete work items");
        },
    });

    return mutation;
};
