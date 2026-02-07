import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["project-teams"][":teamId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api["project-teams"][":teamId"]["$patch"]>["json"];

interface UseUpdateProjectTeamProps {
    projectId: string;
}

export const useUpdateProjectTeam = ({ projectId }: UseUpdateProjectTeamProps) => {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, { teamId: string; json: RequestType }>({
        mutationFn: async ({ teamId, json }) => {
            if (!teamId) {
                throw new Error("Team ID is required");
            }
            
            const response = await client.api["project-teams"][":teamId"]["$patch"]({
                param: { teamId },
                json,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                const errorMessage = (errorData as { error?: string }).error || "Failed to update team";
                throw new Error(errorMessage);
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Team updated successfully");
            queryClient.invalidateQueries({ queryKey: ["project-teams", projectId] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update team");
        },
    });
};
