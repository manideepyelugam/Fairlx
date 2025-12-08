import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api)["saved-views"]["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api)["saved-views"]["$post"]>;

export const useCreateSavedView = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api["saved-views"].$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create saved view.");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("View saved.");
      queryClient.invalidateQueries({ queryKey: ["saved-views", variables.json.workspaceId] });
    },
    onError: () => {
      toast.error("Failed to save view.");
    },
  });

  return mutation;
};
