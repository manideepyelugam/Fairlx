import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { QUERY_CONFIG } from "@/lib/query-config";

interface UseGetMySpaceItemsProps {
    enabled?: boolean;
}

/**
 * Fetches ALL work items assigned to the current user across ALL workspaces.
 * For personal accounts → single workspace.
 * For org accounts → aggregated across all workspaces.
 */
export const useGetMySpaceItems = ({
    enabled = true,
}: UseGetMySpaceItemsProps = {}) => {
    const query = useQuery({
        queryKey: ["my-space-work-items"],
        enabled,
        staleTime: QUERY_CONFIG.DYNAMIC.staleTime,
        gcTime: QUERY_CONFIG.DYNAMIC.gcTime,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const response = await client.api["my-space"]["work-items"].$get();

            if (!response.ok) {
                throw new Error("Failed to fetch my space work items.");
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
};
