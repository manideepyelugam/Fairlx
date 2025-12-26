"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RemoveOrgMemberData {
    organizationId: string;
    userId: string;
}

/**
 * Hook for removing a member from an organization
 * ADMIN or OWNER can remove members
 * 
 * INVARIANT: Cannot remove last OWNER
 */
export const useRemoveOrgMember = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ organizationId, userId }: RemoveOrgMemberData) => {
            const response = await fetch(
                `/api/organizations/${organizationId}/members/${userId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to remove member");
            }

            return response.json();
        },
        onSuccess: (_, variables) => {
            toast.success("Member removed from organization");
            queryClient.invalidateQueries({ queryKey: ["org-members", variables.organizationId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to remove member");
        },
    });
};
