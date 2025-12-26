"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdateOrgMemberRoleData {
    organizationId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
}

/**
 * Hook for updating an organization member's role
 * ADMIN or OWNER can update roles
 * 
 * INVARIANT: Cannot remove last OWNER
 */
export const useUpdateOrgMemberRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ organizationId, userId, role }: UpdateOrgMemberRoleData) => {
            const response = await fetch(
                `/api/organizations/${organizationId}/members/${userId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role }),
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to update member role");
            }

            return response.json();
        },
        onSuccess: (_, variables) => {
            toast.success("Member role updated");
            queryClient.invalidateQueries({ queryKey: ["org-members", variables.organizationId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update member role");
        },
    });
};
