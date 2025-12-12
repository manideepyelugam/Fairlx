import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.workflows)[":workflowId"]["$delete"], 200>;
type RequestType = InferRequestType<(typeof client.api.workflows)[":workflowId"]["$delete"]>;

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.workflows[":workflowId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete workflow.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Workflow deleted.");
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflow", data.$id] });
    },
    onError: () => {
      toast.error("Failed to delete workflow.");
    },
  });

  return mutation;
};
