import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.spaces[":spaceId"]["members"][":memberId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.spaces[":spaceId"]["members"][":memberId"]["$delete"]>;

export const useRemoveSpaceMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.spaces[":spaceId"]["members"][":memberId"]["$delete"]({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to remove member from space.");
      }

      return await response.json();
    },
    onSuccess: (_, { param }) => {
      toast.success("Member removed from space");
      queryClient.invalidateQueries({ queryKey: ["space-members", param.spaceId] });
    },
    onError: () => {
      toast.error("Failed to remove member from space");
    },
  });

  return mutation;
};
