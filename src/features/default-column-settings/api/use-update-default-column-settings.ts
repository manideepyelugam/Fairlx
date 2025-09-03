import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["default-column-settings"]["$post"]>;
type RequestType = InferRequestType<typeof client.api["default-column-settings"]["$post"]>;

export const useUpdateDefaultColumnSettings = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api["default-column-settings"]["$post"]({ json });

      if (!response.ok) {
        throw new Error("Failed to update default column settings");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Column settings updated");
      
      // Get workspace ID from the first setting (all settings should have the same workspace ID)
      const workspaceId = data[0]?.workspaceId;
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ["default-column-settings", workspaceId] });
      }
    },
    onError: () => {
      toast.error("Failed to update column settings");
    },
  });

  return mutation;
};
