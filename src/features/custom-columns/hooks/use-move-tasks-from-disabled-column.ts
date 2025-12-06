"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useBulkUpdateTasks } from "@/features/tasks/api/use-bulk-update-tasks";
import { TaskStatus } from "@/features/tasks/types";

export const useMoveTasksFromDisabledColumn = () => {
  const queryClient = useQueryClient();
  const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();

  const mutation = useMutation({
    mutationFn: async ({ fromColumn, toColumn = TaskStatus.TODO }: { 
      fromColumn: TaskStatus; 
      toColumn?: TaskStatus;
    }) => {
      // Get all tasks data from the cache
      const workspaceTasks = queryClient.getQueriesData({ 
        queryKey: ["tasks"] 
      });
      
      // Find tasks in the column being disabled
      const tasksToMove: string[] = [];
      workspaceTasks.forEach(([, data]: [unknown, unknown]) => {
        if (data && typeof data === 'object' && 'documents' in data) {
          const documents = (data as { documents: unknown[] }).documents;
          documents.forEach((task: unknown) => {
            if (task && typeof task === 'object' && '$id' in task && 'status' in task) {
              const taskObj = task as { $id: string; status: string };
              if (taskObj.status === fromColumn) {
                tasksToMove.push(taskObj.$id);
              }
            }
          });
        }
      });

      // Move tasks to target column
      if (tasksToMove.length > 0) {
        const updates = tasksToMove.map(taskId => ({
          $id: taskId,
          status: toColumn,
        }));

        await new Promise((resolve, reject) => {
          bulkUpdateTasks(
            { json: { tasks: updates } },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });

        return tasksToMove.length;
      }

      return 0;
    },
    onSuccess: (movedCount, { fromColumn, toColumn = TaskStatus.TODO }) => {
      if (movedCount > 0) {
        toast.success(`Moved ${movedCount} task${movedCount === 1 ? '' : 's'} from ${fromColumn} to ${toColumn}`);
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to move tasks");
    },
  });

  return mutation;
};
