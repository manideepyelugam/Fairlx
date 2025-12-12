import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.workflows)[":workflowId"]["statuses"][":statusId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workflows)[":workflowId"]["statuses"][":statusId"]["$delete"]
>;

export const useDeleteStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.workflows[":workflowId"]["statuses"][":statusId"]["$delete"]({
        param,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to delete status");
      }

      return await response.json();
    },
    onSuccess: (_, { param }) => {
      toast.success("Status deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["workflow", param.workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", param.workflowId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete status");
    },
  });

  return mutation;
};
