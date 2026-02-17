import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

export const useGetWebhooks = (projectId: string) => {
    const query = useQuery({
        queryKey: ["webhooks", { projectId }],
        queryFn: async () => {
            const response = await client.api["project-webhooks"].$get({
                query: { projectId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch webhooks");
            }

            const { data } = await response.json();
            return data;
        },
    });

    return query;
};
