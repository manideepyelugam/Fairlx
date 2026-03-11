import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

/**
 * Query hook to resolve a BYOB tenant's public info by orgSlug.
 */
export const useBYOBTenant = (orgSlug: string) => {
    const query = useQuery({
        queryKey: ["byob-tenant", orgSlug],
        queryFn: async () => {
            const response = await client.api.byob.resolve[":orgSlug"].$get({
                param: { orgSlug },
            });

            if (!response.ok) {
                throw new Error("Organisation not found");
            }

            return await response.json();
        },
        enabled: !!orgSlug && orgSlug.length >= 3,
        retry: false,
    });

    return query;
};
