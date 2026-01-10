"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MemberRole } from "../types";

interface AddMemberFromOrgData {
    workspaceId: string;
    userId: string;
    role: MemberRole;
}

/**
 * Hook to add an organization member to a workspace
 * 
 * This enables explicit assignment of org members to workspaces
 * rather than relying solely on invite codes.
 */
export const useAddWorkspaceMemberFromOrg = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ workspaceId, userId, role }: AddMemberFromOrgData) => {
            const response = await fetch(`/api/members/from-org`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId, userId, role }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add member");
            }

            return response.json();
        },
        onSuccess: (_, variables) => {
            toast.success("Member added to workspace");
            queryClient.invalidateQueries({ queryKey: ["members", variables.workspaceId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to add member");
        },
    });

    return mutation;
};
