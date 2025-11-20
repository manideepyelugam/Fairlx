import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.teams)[":teamId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.teams)[":teamId"]["$delete"]
>;

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.teams[":teamId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete team.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Team deleted.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
    onError: () => {
      toast.error("Failed to delete team.");
    },
  });

  return mutation;
};
