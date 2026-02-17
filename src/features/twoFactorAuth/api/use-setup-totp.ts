import { useMutation } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api["two-factor-auth"]["setup-totp"])["$post"]>;

export const useSetupTotp = () => {
    const mutation = useMutation<ResponseType, Error>({
        mutationFn: async () => {
            const response = await client.api["two-factor-auth"]["setup-totp"].$post();

            if (!response.ok) {
                throw new Error("Failed to setup TOTP");
            }

            return await response.json();
        },
    });

    return mutation;
};
