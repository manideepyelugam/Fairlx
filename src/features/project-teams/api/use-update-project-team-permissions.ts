import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["project-teams"][":teamId"]["permissions"]["$put"], 200>;
type RequestType = InferRequestType<typeof client.api["project-teams"][":teamId"]["permissions"]["$put"]>["json"];

interface UseUpdateProjectTeamPermissionsProps {
    teamId: string;
}

export const useUpdateProjectTeamPermissions = ({ teamId }: UseUpdateProjectTeamPermissionsProps) => {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api["project-teams"][":teamId"]["permissions"]["$put"]({
                param: { teamId },
                json,
            });

            if (!response.ok) {
                throw new Error("Failed to update permissions");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Team permissions updated");
            queryClient.invalidateQueries({ queryKey: ["project-team-permissions", teamId] });
            // Invalidate project permissions too as they might affect current user
            queryClient.invalidateQueries({ queryKey: ["project-permissions"] });
        },
        onError: () => {
            toast.error("Failed to update permissions");
        },
    });
};
