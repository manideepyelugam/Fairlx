import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["project-members"]["$post"], 201>;
type RequestType = InferRequestType<typeof client.api["project-members"]["$post"]>["json"];

/**
 * Hook to add a member to a project team
 */
export const useAddProjectMember = () => {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (data) => {
            const response = await client.api["project-members"].$post({ json: data });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to add member");
            }

            return await response.json() as ResponseType;
        },
        onSuccess: (_, variables) => {
            toast.success("Member added successfully");
            queryClient.invalidateQueries({ queryKey: ["project-members", variables.projectId] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to add member");
        },
    });
};
