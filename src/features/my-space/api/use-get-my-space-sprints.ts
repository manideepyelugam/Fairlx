import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export const useGetMySpaceSprints = ({ enabled = true }: { enabled?: boolean } = {}) => {
    const query = useQuery({
        queryKey: ["my-space-sprints"],
        queryFn: async () => {
            const response = await client.api["my-space"]["sprints"].$get();

            if (!response.ok) {
                throw new Error("Failed to fetch my space sprints");
            }

            const { data } = await response.json();
            return data;
        },
        enabled,
    });

    return query;
};
