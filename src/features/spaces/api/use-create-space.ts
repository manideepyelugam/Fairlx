import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.spaces)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.spaces)["$post"]>;

export const useCreateSpace = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.spaces.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create space.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Space created.");
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: () => {
      toast.error("Failed to create space.");
    },
  });

  return mutation;
};
