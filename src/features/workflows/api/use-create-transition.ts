import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.workflows)[":workflowId"]["transitions"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workflows)[":workflowId"]["transitions"]["$post"]
>;

export const useCreateTransition = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.workflows[":workflowId"]["transitions"]["$post"]({
        param,
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to create transition");
      }

      return await response.json();
    },
    onSuccess: (_, { param }) => {
      toast.success("Transition created successfully");
      queryClient.invalidateQueries({ queryKey: ["workflow", param.workflowId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create transition");
    },
  });

  return mutation;
};
