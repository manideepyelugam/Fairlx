import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api)["custom-fields"]["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api)["custom-fields"]["$post"]>;

export const useCreateCustomField = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api["custom-fields"].$post({ json });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData as { error: string }).error || "Failed to create custom field.");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Custom field created.");
      queryClient.invalidateQueries({ queryKey: ["custom-fields", variables.json.workspaceId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create custom field.");
    },
  });

  return mutation;
};
