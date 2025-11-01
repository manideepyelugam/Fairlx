import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.sprints)[":sprintId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.sprints)[":sprintId"]["$patch"]
>;

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.sprints[":sprintId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update sprint");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Sprint updated successfully");
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["sprint", data.$id] });
    },
    onError: () => {
      toast.error("Failed to update sprint");
    },
  });

  return mutation;
};
