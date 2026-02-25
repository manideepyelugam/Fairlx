import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetMySpaceActivityLogs = ({ limit = 10, enabled }: { limit?: number, enabled?: boolean } = {}) => {
    const query = useQuery({
        queryKey: ["my-space-activity-logs", limit],
        queryFn: async () => {
            const response = await client.api["my-space"]["activity-logs"].$get({
                query: { limit: limit.toString() }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch My Space activity logs");
            }

            const { data } = await response.json();
            return data;
        },
        enabled,
    });

    return query;
};
