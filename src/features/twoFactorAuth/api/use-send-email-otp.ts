import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api["two-factor-auth"]["send-email-otp"])["$post"]>;
type RequestType = InferRequestType<(typeof client.api["two-factor-auth"]["send-email-otp"])["$post"]>;

export const useSendEmailOtp = () => {
    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api["two-factor-auth"]["send-email-otp"].$post({ json });

            if (!response.ok) {
                throw new Error("Failed to send verification code");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Verification code sent to your email.");
        },
        onError: () => {
            toast.error("Failed to send verification code.");
        },
    });

    return mutation;
};
