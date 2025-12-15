import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.spaces[":spaceId"]["members"][":memberId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.spaces[":spaceId"]["members"][":memberId"]["$patch"]>;

export const useUpdateSpaceMemberRole = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.spaces[":spaceId"]["members"][":memberId"]["$patch"]({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update member role.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Member role updated");
      queryClient.invalidateQueries({ queryKey: ["space-members", data.spaceId] });
    },
    onError: () => {
      toast.error("Failed to update member role");
    },
  });

  return mutation;
};
