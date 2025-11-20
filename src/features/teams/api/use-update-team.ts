import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.teams)[":teamId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.teams)[":teamId"]["$patch"]
>;

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.teams[":teamId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update team.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Team updated.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: () => {
      toast.error("Failed to update team.");
    },
  });

  return mutation;
};
