import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseCurrentMemberProps {
    workspaceId: string;
}

export const useCurrentMember = ({ workspaceId }: UseCurrentMemberProps) => {
    const query = useQuery({
        queryKey: ["members", workspaceId, "current"],
        queryFn: async () => {
            const response = await client.api.members.current.$get({
                query: { workspaceId },
            });

            if (!response.ok) {
                return null;
            }

            const { data } = await response.json();
            return data;
        },
    });

    return query;
};
