import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api)["work-items"]["bulk-move"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api)["work-items"]["bulk-move"]["$post"]
>["json"];

export const useBulkMoveWorkItems = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api["work-items"]["bulk-move"].$post({
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to move work items");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Work items moved successfully");
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
    onError: () => {
      toast.error("Failed to move work items");
    },
  });

  return mutation;
};
