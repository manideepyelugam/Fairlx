import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { QUERY_CONFIG } from "@/lib/query-config";

interface UseGetMySpaceProjectsProps {
    enabled?: boolean;
}

/**
 * Fetches ALL projects across ALL workspaces the current user belongs to.
 */
export const useGetMySpaceProjects = ({
    enabled = true,
}: UseGetMySpaceProjectsProps = {}) => {
    const query = useQuery({
        queryKey: ["my-space-projects"],
        enabled,
        staleTime: QUERY_CONFIG.STATIC.staleTime,
        gcTime: QUERY_CONFIG.STATIC.gcTime,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const response = await client.api["my-space"]["projects"].$get();

            if (!response.ok) {
                throw new Error("Failed to fetch my space projects.");
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
};
