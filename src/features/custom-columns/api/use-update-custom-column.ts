import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["custom-columns"][":customColumnId"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api["custom-columns"][":customColumnId"]["$patch"]>;

export const useUpdateCustomColumn = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api["custom-columns"][":customColumnId"]["$patch"]({ 
        param, 
        json 
      });

      if (!response.ok) {
        throw new Error("Failed to update custom column");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Custom column updated");
      queryClient.invalidateQueries({ queryKey: ["custom-columns"] });
    },
    onError: () => {
      toast.error("Failed to update custom column");
    },
  });

  return mutation;
};
