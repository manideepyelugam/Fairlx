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
        const errorData = await response.json().catch(() => ({ error: "Failed to update team" }));
        throw new Error((errorData as { error?: string }).error || "Failed to update team");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Team updated successfully");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update team");
    },
  });

  return mutation;
};
