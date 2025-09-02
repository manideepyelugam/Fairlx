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
      // Invalidate both specific and any generic custom-column queries for safety
      queryClient.invalidateQueries({ queryKey: ["custom-columns", data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["custom-columns"] });
    },
    onError: () => {
      toast.error("Failed to create custom column");
    },
  });

  return mutation;
};
