import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["personal-backlog"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api["personal-backlog"]["$post"]>["json"];

export const useCreateBacklogItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api["personal-backlog"]["$post"]({ json });

      if (!response.ok) {
        throw new Error("Failed to create backlog item");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Backlog item created");
      queryClient.invalidateQueries({ queryKey: ["personal-backlog"] });
    },
    onError: () => {
      toast.error("Failed to create backlog item");
    },
  });

  return mutation;
};
