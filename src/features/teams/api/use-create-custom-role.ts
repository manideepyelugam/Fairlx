import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api.teams)[":teamId"]["custom-roles"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.teams)[":teamId"]["custom-roles"]["$post"]
>;

export const useCreateCustomRole = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.teams[":teamId"]["custom-roles"].$post({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to create custom role");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Custom role created successfully");
      queryClient.invalidateQueries({ queryKey: ["custom-roles", data.teamId] });
    },
    onError: () => {
      toast.error("Failed to create custom role");
    },
  });

  return mutation;
};
