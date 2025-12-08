import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.spaces)[":spaceId"]["$delete"], 200>;
type RequestType = InferRequestType<(typeof client.api.spaces)[":spaceId"]["$delete"]>;

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.spaces[":spaceId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete space.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Space deleted.");
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: () => {
      toast.error("Failed to delete space.");
    },
  });

  return mutation;
};
