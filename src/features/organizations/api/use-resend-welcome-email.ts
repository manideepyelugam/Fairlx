"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

/**
 * Hook to resend welcome email with new temp password
 * Only works for members with mustResetPassword = true
 */
export const useResendWelcomeEmail = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
            const response = await client.api.organizations[":orgId"]["members"][":userId"]["resend-welcome"].$post({
                param: { orgId, userId },
            });

            if (!response.ok) {
                const errorData = await response.json() as { error?: string; code?: string };

                if (errorData.code === "ALREADY_ACTIVATED") {
                    throw new Error("This member has already activated their account.");
                }

                throw new Error(errorData.error || "Failed to resend welcome email");
            }

            return await response.json();
        },
        onSuccess: (_, variables) => {
            toast.success("Welcome email resent with new temporary password");
            queryClient.invalidateQueries({ queryKey: ["org-members", variables.orgId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to resend welcome email");
        },
    });

    return mutation;
};
