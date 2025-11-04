import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["personal-backlog"][":itemId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api["personal-backlog"][":itemId"]["$patch"]>;

export const useUpdateBacklogItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api["personal-backlog"][":itemId"]["$patch"]({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update backlog item");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Backlog item updated");
      queryClient.invalidateQueries({ queryKey: ["personal-backlog"] });
    },
    onError: () => {
      toast.error("Failed to update backlog item");
    },
  });

  return mutation;
};
