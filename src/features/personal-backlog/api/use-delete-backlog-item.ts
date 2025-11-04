import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["personal-backlog"][":itemId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api["personal-backlog"][":itemId"]["$delete"]>;

export const useDeleteBacklogItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api["personal-backlog"][":itemId"]["$delete"]({ param });

      if (!response.ok) {
        throw new Error("Failed to delete backlog item");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Backlog item deleted");
      queryClient.invalidateQueries({ queryKey: ["personal-backlog"] });
    },
    onError: () => {
      toast.error("Failed to delete backlog item");
    },
  });

  return mutation;
};
