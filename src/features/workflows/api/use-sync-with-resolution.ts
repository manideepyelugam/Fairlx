"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType, InferRequestType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.workflows)[":workflowId"]["sync-with-resolution"][":projectId"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workflows)[":workflowId"]["sync-with-resolution"][":projectId"]["$post"]
>;

export const useSyncWithResolution = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.workflows[":workflowId"]["sync-with-resolution"][":projectId"]["$post"]({
        param,
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to sync workflow and project");
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      const resolution = data.data.resolution;
      toast.success(
        resolution === "workflow" 
          ? "Project synced to workflow statuses" 
          : "Workflow updated with project statuses"
      );
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
      toast.error(error.message || "Failed to sync workflow and project");
    },
  });

  return mutation;
};
