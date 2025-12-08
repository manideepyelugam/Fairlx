import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.spaces)[":spaceId"]["$patch"], 200>;
type RequestType = InferRequestType<(typeof client.api.spaces)[":spaceId"]["$patch"]>;

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.spaces[":spaceId"].$patch({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to update space.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Space updated.");
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      queryClient.invalidateQueries({ queryKey: ["space", data.$id] });
    },
    onError: () => {
      toast.error("Failed to update space.");
    },
  });

  return mutation;
};
