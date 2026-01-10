"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType, InferRequestType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.workflows)[":workflowId"]["connect-project"][":projectId"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workflows)[":workflowId"]["connect-project"][":projectId"]["$post"]
>;

export const useConnectProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.workflows[":workflowId"]["connect-project"][":projectId"]["$post"]({
        param,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to connect project to workflow");
      }

      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success("Project connected to workflow");
      // Invalidate all related caches for immediate UI update
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflow", variables.param.workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", variables.param.workflowId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.param.projectId] });
      queryClient.invalidateQueries({ queryKey: ["custom-columns"] });
      queryClient.invalidateQueries({ queryKey: ["default-column-settings"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to connect project to workflow");
    },
  });

  return mutation;
};

// Legacy export for backwards compatibility
export const useSyncFromProject = useConnectProject;
