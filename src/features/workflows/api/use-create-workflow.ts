import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.workflows)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.workflows)["$post"]>;

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.workflows.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create workflow.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Workflow created.");
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: () => {
      toast.error("Failed to create workflow.");
    },
  });

  return mutation;
};
