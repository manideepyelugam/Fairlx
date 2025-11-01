import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api)["work-items"][":workItemId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api)["work-items"][":workItemId"]["$delete"]
>;

export const useDeleteWorkItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api["work-items"][":workItemId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete work item");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Work item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
    onError: () => {
      toast.error("Failed to delete work item");
    },
  });

  return mutation;
};
