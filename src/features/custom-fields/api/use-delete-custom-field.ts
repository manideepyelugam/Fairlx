import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api)["custom-fields"][":fieldId"]["$delete"], 200>;
type RequestType = InferRequestType<(typeof client.api)["custom-fields"][":fieldId"]["$delete"]>;

export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api["custom-fields"][":fieldId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete custom field.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Custom field deleted.");
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
    },
    onError: () => {
      toast.error("Failed to delete custom field.");
    },
  });

  return mutation;
};
