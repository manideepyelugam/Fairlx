import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetTimelineDataProps {
  workspaceId: string;
  projectId?: string;
}

export const useGetTimelineData = ({
  workspaceId,
  projectId,
}: UseGetTimelineDataProps) => {
  const query = useQuery({
    queryKey: ["timeline-data", workspaceId, projectId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error("workspaceId is required to fetch timeline data.");
      }

      // Fetch sprints
      const sprintsResponse = await client.api.sprints.$get({
        query: {
          workspaceId,
          projectId: projectId || "",
        },
      });

      if (!sprintsResponse.ok) {
        throw new Error("Failed to fetch sprints.");
      }

      const { data: sprints } = await sprintsResponse.json();

      // Fetch work items - use tasks API when projectId is provided
      let workItems;
      if (projectId) {
        // Use tasks API for project-specific timeline
        const tasksResponse = await client.api.tasks.$get({
          query: {
            workspaceId,
            projectId,
          },
        });

        if (!tasksResponse.ok) {
          throw new Error("Failed to fetch tasks.");
        }

        const tasksData = await tasksResponse.json();
        // Tasks API returns {data: {total, documents}}, extract the inner data
        workItems = tasksData.data;
      } else {
        // Use work-items API for workspace-level timeline
        const workItemsResponse = await client.api["work-items"].$get({
          query: {
            workspaceId,
            projectId: "",
          },
        });

        if (!workItemsResponse.ok) {
          throw new Error("Failed to fetch work items.");
        }

        const { data: workItemsData } = await workItemsResponse.json();
        workItems = workItemsData;
      }

      return {
        sprints,
        workItems,
      };
    },
  });

  return query;
};
