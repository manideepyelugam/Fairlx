import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  (typeof client.api)["work-items"][":workItemId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api)["work-items"][":workItemId"]["$patch"]
>;

export const useUpdateTimelineItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api["work-items"][":workItemId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update work item.");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: ({ data }) => {
      toast.success("Work item updated successfully");
      
      // Invalidate timeline data to refetch
      queryClient.invalidateQueries({
        queryKey: ["timeline-data"],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["work-items"],
      });

      queryClient.invalidateQueries({
        queryKey: ["work-item", data.$id],
      });
    },
    onError: () => {
      toast.error("Failed to update work item");
    },
  });

  return mutation;
};
