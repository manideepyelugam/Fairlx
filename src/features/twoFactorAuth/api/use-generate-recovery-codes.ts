import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api["two-factor-auth"]["recovery-codes"])["$post"]>;

export const useGenerateRecoveryCodes = () => {
    const mutation = useMutation<ResponseType, Error>({
        mutationFn: async () => {
            const response = await client.api["two-factor-auth"]["recovery-codes"].$post();

            if (!response.ok) {
                throw new Error("Failed to generate recovery codes");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("New recovery codes generated.");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return mutation;
};
