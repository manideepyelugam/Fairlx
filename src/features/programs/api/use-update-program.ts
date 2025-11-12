import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.programs)[":programId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.programs)[":programId"]["$patch"]
>;

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.programs[":programId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update program.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Program updated.");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["programs", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => {
      toast.error("Failed to update program.");
    },
  });

  return mutation;
};
