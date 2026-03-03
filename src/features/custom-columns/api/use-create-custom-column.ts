import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["custom-columns"]["$post"]>;
type RequestType = InferRequestType<typeof client.api["custom-columns"]["$post"]>;

export const useCreateCustomColumn = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api["custom-columns"]["$post"]({ json });

      if (!response.ok) {
        throw new Error("Failed to create custom column");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Custom column created");
      // Invalidate queries for this specific workspace and project
      queryClient.invalidateQueries({ queryKey: ["custom-columns", data.workspaceId, data.projectId] });
      // Also invalidate workflow-statuses in case we synced to a workflow
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    },
    onError: () => {
      toast.error("Failed to create custom column");
    },
  });

  return mutation;
};
