import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetMySpaceMembers = () => {
    const query = useQuery({
        queryKey: ["my-space-members"],
        queryFn: async () => {
            const response = await client.api["my-space"]["members"].$get();

            if (!response.ok) {
                throw new Error("Failed to fetch My Space members");
            }

            const { data } = await response.json();
            return data;
        },
    });

    return query;
};
