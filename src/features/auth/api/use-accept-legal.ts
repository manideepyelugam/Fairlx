import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api.auth["accept-legal"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.auth["accept-legal"]["$post"]>["json"];

export const useAcceptLegal = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.auth["accept-legal"]["$post"]({ json });

            if (!response.ok) {
                const errorData = await response.json() as { error?: string };
                throw new Error(errorData.error || "Failed to accept legal terms");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Legal terms accepted");
            queryClient.invalidateQueries({ queryKey: ["account-lifecycle"] });
        },
        onError: (error) => {
            toast.error(error.message || "Something went wrong");
        },
    });

    return mutation;
};
