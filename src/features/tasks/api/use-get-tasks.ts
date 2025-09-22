import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

import { TaskStatus, TaskPriority } from "../types";

interface UseGetTasksProps {
  workspaceId: string;
  projectId?: string | null;
  status?: TaskStatus | string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  search?: string | null;
  priority?: TaskPriority | null;
  labels?: string[] | null;
}

export const useGetTasks = ({
  workspaceId,
  projectId,
  status,
  assigneeId,
  dueDate,
  search,
  priority,
  labels,
}: UseGetTasksProps) => {
  const query = useQuery({
    queryKey: [
      "tasks",
      workspaceId,
      projectId,
      status,
      assigneeId,
      dueDate,
      search,
      priority,
      labels,
    ],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: {
          workspaceId,
          projectId: projectId ?? undefined,
          status: status ?? undefined,
          assigneeId: assigneeId ?? undefined,
          dueDate: dueDate ?? undefined,
          search: search ?? undefined,
          priority: priority ?? undefined,
          labels: labels ? labels.join(",") : undefined,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
