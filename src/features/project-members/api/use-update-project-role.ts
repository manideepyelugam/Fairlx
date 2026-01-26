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
            const response = await client.api["project-members"]["roles"][":roleId"]["$patch"]({
                param: { roleId },
                json,
            });

            if (!response.ok) {
                throw new Error("Failed to update role");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Role updated");
            queryClient.invalidateQueries({ queryKey: ["project-roles"] });
            // Invalidate project permissions as role changes affect access
            queryClient.invalidateQueries({ queryKey: ["project-permissions"] });
        },
        onError: () => {
            toast.error("Failed to update role");
        },
    });
};
