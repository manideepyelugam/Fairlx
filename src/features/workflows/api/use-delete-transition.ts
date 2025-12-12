import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.workflows)[":workflowId"]["transitions"][":transitionId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workflows)[":workflowId"]["transitions"][":transitionId"]["$delete"]
>;

export const useDeleteTransition = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.workflows[":workflowId"]["transitions"][":transitionId"]["$delete"]({
        param,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to delete transition");
      }

      return await response.json();
    },
    onSuccess: (_, { param }) => {
      toast.success("Transition deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["workflow", param.workflowId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete transition");
    },
  });

  return mutation;
};
