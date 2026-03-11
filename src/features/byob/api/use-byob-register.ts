import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.byob.register)["$post"]>;
type RequestType = InferRequestType<(typeof client.api.byob.register)["$post"]>;

export const useBYOBRegister = () => {
    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.byob.register.$post({ json });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    "error" in errorData ? errorData.error : "Registration failed"
                );
            }

            return await response.json();
        },
        onSuccess: (data) => {
            if ("success" in data && data.success) {
                toast.success("Organisation registered!");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to register organisation");
        },
    });

    return mutation;
};
