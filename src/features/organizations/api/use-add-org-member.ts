"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddOrgMemberData {
    organizationId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
}

/**
 * Hook for adding a member to an organization
 * ADMIN or OWNER can add members
 */
export const useAddOrgMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ organizationId, userId, role }: AddOrgMemberData) => {
            const response = await fetch(
                `/api/organizations/${organizationId}/members`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, role }),
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to add member");
            }

            return response.json();
        },
        onSuccess: (_, variables) => {
            toast.success("Member added to organization");
            queryClient.invalidateQueries({ queryKey: ["org-members", variables.organizationId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to add member");
        },
    });
};
