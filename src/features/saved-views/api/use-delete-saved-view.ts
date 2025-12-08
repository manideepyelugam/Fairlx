import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api)["saved-views"][":viewId"]["$delete"], 200>;
type RequestType = InferRequestType<(typeof client.api)["saved-views"][":viewId"]["$delete"]>;

export const useDeleteSavedView = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api["saved-views"][":viewId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete saved view.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("View deleted.");
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
    },
    onError: () => {
      toast.error("Failed to delete view.");
    },
  });

  return mutation;
};
