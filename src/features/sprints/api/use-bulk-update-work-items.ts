import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

interface BulkUpdateWorkItemsRequest {
  workItems: {
    $id: string;
    status: string; // Changed from WorkItemStatus to string to support custom column IDs
    position: number;
  }[];
}

export const useBulkUpdateWorkItems = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, { json: BulkUpdateWorkItemsRequest }>({
    mutationFn: async ({ json }) => {
      // Update each work item individually
      // This is a simple approach - could be optimized with a bulk endpoint later
      const updatePromises = json.workItems.map(async (item) => {
        const response = await client.api["work-items"][":workItemId"].$patch({
          param: { workItemId: item.$id },
          json: {
            status: item.status,
            position: item.position,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to update work item ${item.$id}`);
        }

        return response.json();
      });

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      toast.success("Work items updated.");
      queryClient.invalidateQueries({ queryKey: ["work-items"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
    onError: () => {
      toast.error("Failed to update work items.");
    },
  });

  return mutation;
};
