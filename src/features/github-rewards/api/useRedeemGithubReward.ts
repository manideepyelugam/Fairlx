import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["github-rewards"]["redeem"]["$post"]>;
type RequestType = InferRequestType<typeof client.api["github-rewards"]["redeem"]["$post"]>;

/**
 * React Query mutation hook for redeeming a GitHub Star Reward coupon.
 *
 * Usage:
 * ```tsx
 * const { mutate, isPending } = useRedeemGithubReward();
 * mutate({ json: { code: "FAIRLX-ABCD1234" } });
 * ```
 */

export const useRedeemGithubReward = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api["github-rewards"]["redeem"]["$post"]({ json });

            if (!response.ok) {
                const errorResponse = response.clone();
                let errorMessage = "Failed to redeem coupon";
                try {
                    const errorData = await errorResponse.json();
                    if (typeof errorData === "object" && errorData !== null) {
                        if ("message" in errorData && typeof errorData.message === "string") {
                            errorMessage = errorData.message;
                        } else if ("error" in errorData) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const err = (errorData as any).error;
                            if (typeof err === "string") errorMessage = err;
                        }
                    }
                } catch {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        },
        onSuccess: (data) => {
            // Invalidate wallet queries so balance refreshes
            queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
            queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });

            if ("creditedAmount" in data) {
                toast.success(
                    `$${data.creditedAmount.toFixed(2)} credited to your wallet from GitHub Star Reward!`
                );
            }
        },
        onError: (error) => {
            const message = error instanceof Error
                ? error.message
                : "Failed to redeem coupon";
            toast.error(message);
        },
    });

    return mutation;
};
