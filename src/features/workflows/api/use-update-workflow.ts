import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.workflows)[":workflowId"]["$patch"], 200>;
type RequestType = InferRequestType<(typeof client.api.workflows)[":workflowId"]["$patch"]>;

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.workflows[":workflowId"].$patch({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to update workflow.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Workflow updated.");
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflow", data.$id] });
    },
    onError: () => {
      toast.error("Failed to update workflow.");
    },
  });

  return mutation;
};
