import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
    (typeof client.api.byob)["validate-credentials"]["$post"]
>;
type RequestType = InferRequestType<
    (typeof client.api.byob)["validate-credentials"]["$post"]
>;

export const useValidateCredentials = () => {
    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.byob["validate-credentials"].$post({
                json,
            });

            const data = await response.json();
            return data;
        },
        onSuccess: (data) => {
            if ("valid" in data && data.valid) {
                toast.success("Credentials validated successfully!");
            } else if ("error" in data) {
                toast.error(`Invalid credentials: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to validate credentials");
        },
    });

    return mutation;
};
