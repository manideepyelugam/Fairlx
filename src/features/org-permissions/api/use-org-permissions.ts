import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { OrgPermissionKey } from "../types";

interface UseOrgPermissionsProps {
    orgId: string;
    orgMemberId: string;
}

/**
 * Hook to get a member's org permissions
 */
export const useOrgPermissions = ({ orgId, orgMemberId }: UseOrgPermissionsProps) => {
    const query = useQuery({
        queryKey: ["org-permissions", orgId, orgMemberId],
        queryFn: async () => {
            const response = await client.api["org-permissions"][":orgId"]["member"][":orgMemberId"].$get({
                param: { orgId, orgMemberId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch permissions");
            }

            const { data } = await response.json();
            return data;
        },
        enabled: !!orgId && !!orgMemberId,
    });

    return query;
};

/**
 * Hook to check if current user has a specific permission
 */
export const useHasOrgPermission = (
    orgId: string | undefined,
    orgMemberId: string | undefined,
    permission: OrgPermissionKey
): { hasPermission: boolean; isLoading: boolean } => {
    const { data, isLoading } = useOrgPermissions({
        orgId: orgId || "",
        orgMemberId: orgMemberId || "",
    });

    if (!orgId || !orgMemberId) {
        return { hasPermission: false, isLoading: false };
    }

    if (isLoading) {
        return { hasPermission: false, isLoading: true };
    }

    // OWNER has all permissions
    if (data?.isOwner) {
        return { hasPermission: true, isLoading: false };
    }

    const hasPermission = data?.permissions?.includes(permission) ?? false;
    return { hasPermission, isLoading: false };
};
