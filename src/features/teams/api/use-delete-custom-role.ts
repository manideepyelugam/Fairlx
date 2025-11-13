import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.teams)[":teamId"]["custom-roles"][":roleId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.teams)[":teamId"]["custom-roles"][":roleId"]["$delete"]
>;

export const useDeleteCustomRole = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.teams[":teamId"]["custom-roles"][":roleId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete custom role");
      }

      return await response.json();
    },
    onSuccess: (_, { param }) => {
      toast.success("Custom role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["custom-roles", param.teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: () => {
      toast.error("Failed to delete custom role");
    },
  });

  return mutation;
};
