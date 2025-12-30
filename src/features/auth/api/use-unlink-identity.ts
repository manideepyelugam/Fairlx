import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/rpc";

/**
 * Hook to unlink an OAuth provider from current user
 * 
 * Safety: Backend prevents unlinking last auth method
 */
export const useUnlinkIdentity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (identityId: string) => {
            const response = await client.api.auth.identities[":identityId"].$delete({
                param: { identityId },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to unlink provider");
            }

            return response.json();
        },
        onSuccess: (data) => {
            const message = (data as { message?: string }).message || "Provider unlinked successfully";
            toast.success(message);
            queryClient.invalidateQueries({ queryKey: ["identities"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
};
