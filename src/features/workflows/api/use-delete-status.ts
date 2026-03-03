import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.workflows)[":workflowId"]["statuses"][":statusId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.workflows)[":workflowId"]["statuses"][":statusId"]["$delete"]
>;

/**
 * Delete a workflow status.
 * 
 * Edge Case 2.7: Status Deletion with Active Tasks
 * - Deleting a status also deletes all transitions to/from it
 * - Tasks currently in the deleted status become "orphaned" (invalid status)
 * - Response includes warning if tasks are affected
 */
export const useDeleteStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.workflows[":workflowId"]["statuses"][":statusId"]["$delete"]({
        param,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as { error?: string }).error || "Failed to delete status");
      }

      return await response.json();
    },
    onSuccess: (response, { param }) => {
      // Check if the response includes a warning about affected tasks
      const data = response.data as {
        $id: string;
        deletedTransitions?: number;
        affectedTasks?: number;
        warning?: string;
      };

      if (data.warning && data.affectedTasks && data.affectedTasks > 0) {
        // Show warning toast for affected tasks
        toast.warning("Status deleted", {
          description: data.warning,
          duration: 6000,
        });
      } else {
        toast.success("Status deleted successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["workflow", param.workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-statuses", param.workflowId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete status");
    },
  });

  return mutation;
};
