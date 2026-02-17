import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api["two-factor-auth"]["enable-email-otp"])["$post"]>;
type RequestType = InferRequestType<(typeof client.api["two-factor-auth"]["enable-email-otp"])["$post"]>;

export const useEnableEmailOtp = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api["two-factor-auth"]["enable-email-otp"].$post({ json });

            if (!response.ok) {
                const errorData = await response.json() as { error: string };
                throw new Error(errorData.error || "Failed to enable email 2FA");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Two-factor authentication (Email) enabled.");
            queryClient.invalidateQueries({ queryKey: ["current"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return mutation;
};
