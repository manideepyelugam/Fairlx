import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.sprints.$post, 200>;
type RequestType = InferRequestType<typeof client.api.sprints.$post>["json"];

export const useCreateSprint = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.sprints.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create sprint");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Sprint created successfully");
      queryClient.invalidateQueries({ queryKey: ["sprints", data.workspaceId, data.projectId] });
    },
    onError: () => {
      toast.error("Failed to create sprint");
    },
  });

  return mutation;
};
