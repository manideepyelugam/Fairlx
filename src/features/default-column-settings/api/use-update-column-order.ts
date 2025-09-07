import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api["default-column-settings"]["order"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api["default-column-settings"]["order"]["$patch"]>;

export const useUpdateColumnOrder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api["default-column-settings"]["order"]["$patch"]({
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update column order");
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["default-column-settings", variables.json.workspaceId, variables.json.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["custom-columns", variables.json.workspaceId, variables.json.projectId],
      });
    },
  });

  return mutation;
};
