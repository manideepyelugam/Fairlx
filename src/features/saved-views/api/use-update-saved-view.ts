import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api)["saved-views"][":viewId"]["$patch"], 200>;
type RequestType = InferRequestType<(typeof client.api)["saved-views"][":viewId"]["$patch"]>;

export const useUpdateSavedView = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api["saved-views"][":viewId"].$patch({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to update saved view.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("View updated.");
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
    },
    onError: () => {
      toast.error("Failed to update view.");
    },
  });

  return mutation;
};
