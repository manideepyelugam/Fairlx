import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.workflows)[":workflowId"]["transitions"][":transitionId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workflows)[":workflowId"]["transitions"][":transitionId"]["$patch"]
>;

export const useUpdateTransition = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.workflows[":workflowId"]["transitions"][":transitionId"]["$patch"]({
        param,
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to update transition");
      }

      return await response.json();
    },
    onSuccess: (_, { param }) => {
      toast.success("Transition updated successfully");
      queryClient.invalidateQueries({ queryKey: ["workflow", param.workflowId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update transition");
    },
  });

  return mutation;
};
