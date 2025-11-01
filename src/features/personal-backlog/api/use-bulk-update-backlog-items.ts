import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["personal-backlog"]["bulk-update"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api["personal-backlog"]["bulk-update"]["$post"]>["json"];

export const useBulkUpdateBacklogItems = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api["personal-backlog"]["bulk-update"]["$post"]({ json });

      if (!response.ok) {
        throw new Error("Failed to update backlog items");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-backlog"] });
    },
    onError: () => {
      toast.error("Failed to update backlog items");
    },
  });

  return mutation;
};
