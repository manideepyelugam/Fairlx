"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteOrganizationData {
    organizationId: string;
}

/**
 * Hook for soft-deleting an organization
 * OWNER only
 * 
 * WHY soft-delete:
 * - Prevents accidental data loss
 * - Enables recovery within grace period (30 days)
 * - Required for billing audit trail
 */
export const useDeleteOrganization = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async ({ organizationId }: DeleteOrganizationData) => {
            const response = await fetch(
                `/api/organizations/${organizationId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to delete organization");
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success("Organization deleted", {
                description: "Your organization has been scheduled for deletion.",
            });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
            // Redirect to homepage after deletion
            router.push("/");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete organization");
        },
    });
};
