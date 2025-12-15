import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.spaces[":spaceId"]["members"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.spaces[":spaceId"]["members"]["$post"]>;

export const useAddSpaceMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.spaces[":spaceId"]["members"]["$post"]({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to add member to space.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Member added to space");
      queryClient.invalidateQueries({ queryKey: ["space-members", data.spaceId] });
    },
    onError: () => {
      toast.error("Failed to add member to space");
    },
  });

  return mutation;
};
