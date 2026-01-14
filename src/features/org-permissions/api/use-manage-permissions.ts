import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

interface UseGrantPermissionProps {
    orgId: string;
}

export const useGrantPermission = ({ orgId }: UseGrantPermissionProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orgMemberId, permissionKey }: { orgMemberId: string; permissionKey: string }) => {
            const response = await client.api["org-permissions"][":orgId"]["grant"].$post({
                param: { orgId },
                json: { orgMemberId, permissionKey },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to grant permission");
            }

            return await response.json();
        },
        onSuccess: (_, { orgMemberId }) => {
            toast.success("Permission granted");
            queryClient.invalidateQueries({ queryKey: ["org-permissions", orgId, orgMemberId] });
            queryClient.invalidateQueries({ queryKey: ["org-permissions", orgId, "all"] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return mutation;
};

export const useRevokePermission = ({ orgId }: UseGrantPermissionProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orgMemberId, permissionKey }: { orgMemberId: string; permissionKey: string }) => {
            const response = await client.api["org-permissions"][":orgId"]["revoke"].$post({
                param: { orgId },
                json: { orgMemberId, permissionKey },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to revoke permission");
            }

            return await response.json();
        },
        onSuccess: (_, { orgMemberId }) => {
            toast.success("Permission revoked");
            queryClient.invalidateQueries({ queryKey: ["org-permissions", orgId, orgMemberId] });
            queryClient.invalidateQueries({ queryKey: ["org-permissions", orgId, "all"] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return mutation;
};

export const useBulkGrantPermissions = ({ orgId }: UseGrantPermissionProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ orgMemberId, permissionKeys }: { orgMemberId: string; permissionKeys: string[] }) => {
            const response = await client.api["org-permissions"][":orgId"]["bulk-grant"].$post({
                param: { orgId },
                json: { orgMemberId, permissionKeys },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to grant permissions");
            }

            return await response.json();
        },
        onSuccess: (_, { orgMemberId }) => {
            toast.success("Permissions updated");
            queryClient.invalidateQueries({ queryKey: ["org-permissions", orgId, orgMemberId] });
            queryClient.invalidateQueries({ queryKey: ["org-permissions", orgId, "all"] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return mutation;
};
