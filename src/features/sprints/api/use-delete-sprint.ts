import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.sprints)[":sprintId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.sprints)[":sprintId"]["$delete"]
>;

export const useDeleteSprint = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.sprints[":sprintId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete sprint");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Sprint deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
    },
    onError: () => {
      toast.error("Failed to delete sprint");
    },
  });

  return mutation;
};
