import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api)["work-items"][":workItemId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api)["work-items"][":workItemId"]["$patch"]
>;

export const useUpdateWorkItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api["work-items"][":workItemId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update work item");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Work item updated successfully");
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
      queryClient.invalidateQueries({ queryKey: ["work-item", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      if (data.sprintId) {
        queryClient.invalidateQueries({ queryKey: ["sprint", data.sprintId] });
      }
    },
    onError: () => {
      toast.error("Failed to update work item");
    },
  });

  return mutation;
};
