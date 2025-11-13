import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.teams)[":teamId"]["custom-roles"][":roleId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.teams)[":teamId"]["custom-roles"][":roleId"]["$patch"]
>;

export const useUpdateCustomRole = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.teams[":teamId"]["custom-roles"][":roleId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update custom role");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Custom role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["custom-roles", data.teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: () => {
      toast.error("Failed to update custom role");
    },
  });

  return mutation;
};
