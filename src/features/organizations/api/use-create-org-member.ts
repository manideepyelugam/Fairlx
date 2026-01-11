"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
    (typeof client.api.organizations)[":orgId"]["members"]["create-user"]["$post"],
    200
>;
type RequestType = InferRequestType<
    (typeof client.api.organizations)[":orgId"]["members"]["create-user"]["$post"]
>;

/**
 * Hook to create a new org member (with Appwrite user account)
 * ORG accounts only - admin creates user with temp password
 */
export const useCreateOrgMember = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ param, json }) => {
            const response = await client.api.organizations[":orgId"]["members"]["create-user"].$post({
                param,
                json,
            });

            if (!response.ok) {
                const errorData = await response.json() as {
                    error?: string;
                    code?: string;
                    orgName?: string;
                    message?: string;
                };

                // Handle EMAIL_EXISTS error with descriptive message
                if (errorData.code === "EMAIL_EXISTS") {
                    throw new Error(
                        errorData.message ||
                        `This email already belongs to ${errorData.orgName || "another organization"}. Please use a different email.`
                    );
                }

                throw new Error(errorData.message || errorData.error || "Failed to create member");
            }

            return await response.json();
        },
        onSuccess: (data, variables) => {
            if (data.data.emailSent) {
                toast.success("Member created successfully! They will receive a welcome email with login instructions.");
            } else {
                toast.warning(`Member created, but email failed to send: ${data.data.emailError}. You can resend it later from the Members list.`);
            }
            queryClient.invalidateQueries({ queryKey: ["org-members", variables.param.orgId] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create member");
        },
    });

    return mutation;
};
