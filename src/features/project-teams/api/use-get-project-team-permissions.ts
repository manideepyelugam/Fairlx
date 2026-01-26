import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetProjectTeamPermissionsProps {
    teamId: string;
}

export const useGetProjectTeamPermissions = ({ teamId }: UseGetProjectTeamPermissionsProps) => {
    return useQuery({
        queryKey: ["project-team-permissions", teamId],
        queryFn: async () => {
            if (!teamId) return [];

            const response = await client.api["project-teams"][":teamId"]["permissions"].$get({
                param: { teamId },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch team permissions");
            }

            const { data } = await response.json();
            return data;
        },
        enabled: !!teamId,
    });
};
