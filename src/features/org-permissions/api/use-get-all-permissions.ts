import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetAllOrgPermissionsProps {
    orgId: string;
}

/**
 * Hook to get all member permissions in an org (for admin view)
 */
export const useGetAllOrgPermissions = ({ orgId }: UseGetAllOrgPermissionsProps) => {
    const query = useQuery({
        queryKey: ["org-permissions", orgId, "all"],
        queryFn: async () => {
            const response = await client.api["org-permissions"][":orgId"]["all"].$get({
                param: { orgId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch permissions");
            }

            const { data } = await response.json();
            return data;
        },
        enabled: !!orgId,
    });

    return query;
};
