import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetRolesProps {
    workspaceId: string;
}

export const useGetRoles = ({ workspaceId }: UseGetRolesProps) => {
    const query = useQuery({
        queryKey: ["roles", workspaceId],
        queryFn: async () => {
            const response = await client.api.roles.$get({
                query: { workspaceId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch roles");
            }

            const { data } = await response.json();
            return data;
        },
    });

    return query;
};
