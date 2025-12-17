import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["project-members"][":memberId"]["$delete"]>;

interface RemoveProjectMemberProps {
    memberId: string;
    projectId: string;
}

/**
 * Hook to remove a member from a project team
 */
export const useRemoveProjectMember = () => {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, RemoveProjectMemberProps>({
        mutationFn: async ({ memberId }) => {
            const response = await client.api["project-members"][":memberId"].$delete({
                param: { memberId },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to remove member");
            }

            return await response.json() as ResponseType;
        },
        onSuccess: (_, variables) => {
            toast.success("Member removed successfully");
            queryClient.invalidateQueries({ queryKey: ["project-members", variables.projectId] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to remove member");
        },
    });
};
