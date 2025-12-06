import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api)["custom-fields"][":fieldId"]["$patch"], 200>;
type RequestType = InferRequestType<(typeof client.api)["custom-fields"][":fieldId"]["$patch"]>;

export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api["custom-fields"][":fieldId"].$patch({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to update custom field.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Custom field updated.");
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
    },
    onError: () => {
      toast.error("Failed to update custom field.");
    },
  });

  return mutation;
};
