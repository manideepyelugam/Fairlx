import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.programs)[":programId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.programs)[":programId"]["$delete"]
>;

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.programs[":programId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete program.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Program deleted.");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["programs", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
    onError: () => {
      toast.error("Failed to delete program.");
    },
  });

  return mutation;
};
