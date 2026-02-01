import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<typeof client.api["project-members"]["roles"][":roleId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api["project-members"]["roles"][":roleId"]["$patch"]>["json"];

export const useUpdateProjectRole = () => {
    const queryClient = useQueryClient();

    return useMutation<ResponseType, Error, { roleId: string; json: RequestType }>({
        mutationFn: async ({ roleId, json }) => {
            if (!roleId) {
                throw new Error("Role ID is required");
            }
            
            const response = await client.api["project-members"]["roles"][":roleId"]["$patch"]({
                param: { roleId },
                json,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                const errorMessage = (errorData as { error?: string }).error || "Failed to update role";
                throw new Error(errorMessage);
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Role permissions updated successfully");
            queryClient.invalidateQueries({ queryKey: ["project-roles"] });
            // Invalidate project permissions as role changes affect access
            queryClient.invalidateQueries({ queryKey: ["project-permissions"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update role");
        },
    });
};
