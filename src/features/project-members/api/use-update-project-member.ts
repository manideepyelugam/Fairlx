import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["project-members"][":memberId"]["$patch"]>;

interface UpdateProjectMemberProps {
    memberId: string;
    projectId: string;
    roleId?: string;
    teamId?: string;
}

/**
 * Hook to update a project member's role or team
 */
export const useUpdateProjectMember = () => {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, UpdateProjectMemberProps>({
        mutationFn: async ({ memberId, roleId, teamId }) => {
            const response = await client.api["project-members"][":memberId"].$patch({
                param: { memberId },
                json: {
                    ...(roleId && { roleId }),
                    ...(teamId && { teamId }),
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to update member");
            }

            return await response.json() as ResponseType;
        },
        onSuccess: (_, variables) => {
            toast.success("Member updated successfully");
            queryClient.invalidateQueries({ queryKey: ["project-members", variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ["project-permissions", variables.projectId] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update member");
        },
    });
};
