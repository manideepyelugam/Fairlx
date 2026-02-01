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
            if (!teamId) {
                throw new Error("Team ID is required");
            }
            
            const response = await client.api["project-teams"][":teamId"]["permissions"]["$put"]({
                param: { teamId },
                json,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                const errorMessage = (errorData as { error?: string }).error || "Failed to update permissions";
                throw new Error(errorMessage);
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Team permissions updated successfully");
            queryClient.invalidateQueries({ queryKey: ["project-team-permissions", teamId] });
            // Invalidate project permissions too as they might affect current user
            queryClient.invalidateQueries({ queryKey: ["project-permissions"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update permissions");
        },
    });
};
