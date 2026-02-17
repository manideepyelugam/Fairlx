import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<(typeof client.api["two-factor-auth"]["verify"])["$post"]>;
type RequestType = InferRequestType<(typeof client.api["two-factor-auth"]["verify"])["$post"]>;

export const useVerify2FA = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api["two-factor-auth"]["verify"].$post({ json });

            if (!response.ok) {
                const errorData = await response.json() as { error: string };
                throw new Error(errorData.error || "Verification failed");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Verification successful.");
            queryClient.invalidateQueries({ queryKey: ["current"] });
            // Redirect to unified callback for post-auth routing
            router.push("/auth/callback");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return mutation;
};
