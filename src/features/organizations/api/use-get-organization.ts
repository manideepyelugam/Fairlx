import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetOrganizationProps {
    orgId: string;
}

/**
 * Fetch a specific organization by ID
 */
export const useGetOrganization = ({ orgId }: UseGetOrganizationProps) => {
    const query = useQuery({
        queryKey: ["organization", orgId],
        queryFn: async () => {
            const response = await client.api.organizations[":orgId"].$get({
                param: { orgId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch organization");
            }

            const { data } = await response.json();
            return data;
        },
        enabled: !!orgId,
    });

    return query;
};
