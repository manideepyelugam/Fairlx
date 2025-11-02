import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["work-items"]["split"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api["work-items"]["split"]["$post"]>;

export const useSplitWorkItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api["work-items"]["split"]["$post"]({ json });

      if (!response.ok) {
        throw new Error("Failed to split work item");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Work item split successfully");
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
    },
    onError: () => {
      toast.error("Failed to split work item");
    },
  });

  return mutation;
};
