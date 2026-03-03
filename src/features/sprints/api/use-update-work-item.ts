import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api)["work-items"][":workItemId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api)["work-items"][":workItemId"]["$patch"]
>;

interface MutationOptions {
  /** Skip success toast */
  silent?: boolean;
  /** Apply optimistic update immediately before API call */
  optimistic?: boolean;
}

export const useUpdateWorkItem = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType & MutationOptions, { previousData: unknown }>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api["work-items"][":workItemId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update work item");
      }

      return await response.json();
    },
    
    // OPTIMISTIC UPDATE: Update cache immediately before API call
    onMutate: async (variables) => {
      if (!variables.optimistic) {
        return { previousData: null };
      }

      const workItemId = variables.param.workItemId;

      // Cancel ALL work-items queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["work-items"], exact: false });
      await queryClient.cancelQueries({ queryKey: ["work-item", workItemId] });

      // Snapshot ALL work-items queries for rollback
      const previousQueries = queryClient.getQueriesData<{ documents: Array<Record<string, unknown>> }>({ 
        queryKey: ["work-items"],
        exact: false 
      });

      // Optimistically update ALL matching work-items caches
      queryClient.setQueriesData<{ documents: Array<Record<string, unknown>> }>(
        { queryKey: ["work-items"], exact: false },
        (old) => {
          if (!old?.documents) return old;
          return {
            ...old,
            documents: old.documents.map((item) =>
              item.$id === workItemId
                ? { ...item, ...variables.json }
                : item
            ),
          };
        }
      );

      // Return context with previous data for rollback
      return { previousData: previousQueries };
    },

    // ROLLBACK: If mutation fails, restore previous data
    onError: (error, variables, context) => {
      if (context?.previousData && variables.optimistic) {
        // Restore all previous queries
        const previousQueries = context.previousData as Array<[readonly unknown[], { documents: Array<Record<string, unknown>> } | undefined]>;
        previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to update work item");
    },

    onSuccess: ({ data }, variables) => {
      if (!variables.silent) {
        toast.success("Work item updated successfully");
      }
      
      // Only invalidate if not using optimistic updates (optimistic already updated cache)
      if (!variables.optimistic) {
        queryClient.invalidateQueries({ queryKey: ["work-items"], exact: false });
      }
      
      queryClient.invalidateQueries({ queryKey: ["work-item", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      if (data.sprintId) {
        queryClient.invalidateQueries({ queryKey: ["sprint", data.sprintId] });
      }
    },

    // SETTLE: Ensure cache consistency after mutation completes
    onSettled: (data, error, variables) => {
      if (variables.optimistic) {
        // Background refetch to ensure consistency (won't block UI)
        queryClient.invalidateQueries({ queryKey: ["work-items"], exact: false });
      }
    },
  });

  return mutation;
};
