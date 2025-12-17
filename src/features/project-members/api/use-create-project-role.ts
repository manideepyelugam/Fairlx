import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["project-members"]["roles"]["$post"], 201>;
type RequestType = InferRequestType<typeof client.api["project-members"]["roles"]["$post"]>["json"];

/**
 * Hook to create a new role for a project
 */
export const useCreateProjectRole = () => {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (data) => {
            const response = await client.api["project-members"]["roles"].$post({ json: data });

            if (!response.ok) {
                const error = await response.json();
                throw new Error((error as { error?: string }).error || "Failed to create role");
            }

            return await response.json() as ResponseType;
        },
        onSuccess: (_, variables) => {
            toast.success("Role created successfully");
            queryClient.invalidateQueries({ queryKey: ["project-roles", variables.projectId] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create role");
        },
    });
};
