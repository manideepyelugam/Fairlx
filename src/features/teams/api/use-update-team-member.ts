import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.teams)[":teamId"]["members"][":memberId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.teams)[":teamId"]["members"][":memberId"]["$patch"]
>;

export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.teams[":teamId"].members[
        ":memberId"
      ].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update team member.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Team member updated.");
      queryClient.invalidateQueries({ queryKey: ["team-members", data.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", data.teamId] });
    },
    onError: () => {
      toast.error("Failed to update team member.");
    },
  });

  return mutation;
};
