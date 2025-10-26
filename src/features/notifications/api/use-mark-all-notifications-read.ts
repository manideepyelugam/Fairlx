import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.notifications)["read-all"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.notifications)["read-all"]["$patch"]
>;

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.notifications["read-all"].$patch({
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success(`Marked ${data.count} notifications as read`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read");
    },
  });

  return mutation;
};
