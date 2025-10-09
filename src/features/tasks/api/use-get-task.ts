import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetTaskProps {
  taskId?: string | null;
  enabled?: boolean;
}

export const useGetTask = ({ taskId, enabled = true }: UseGetTaskProps) => {
  const sanitizedTaskId = taskId?.trim() ? taskId.trim() : undefined;

  const query = useQuery({
    queryKey: ["task", sanitizedTaskId],
    enabled: enabled && Boolean(sanitizedTaskId),
    queryFn: async () => {
      if (!sanitizedTaskId) {
        throw new Error("Task ID is required to fetch task details.");
      }

      const response = await client.api.tasks[":taskId"].$get({
        param: { taskId: sanitizedTaskId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch task.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
