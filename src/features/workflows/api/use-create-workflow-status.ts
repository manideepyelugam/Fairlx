import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.workflows)[":workflowId"]["statuses"]["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.workflows)[":workflowId"]["statuses"]["$post"]>;

export const useCreateWorkflowStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.workflows[":workflowId"]["statuses"].$post({ 
        json, 
        param 
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow status.");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Status created.");
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", variables.param.workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflow", variables.param.workflowId] });
    },
    onError: () => {
      toast.error("Failed to create workflow status.");
    },
  });

  return mutation;
};
