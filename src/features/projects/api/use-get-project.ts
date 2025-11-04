import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetProjectProps {
  projectId?: string | null;
  enabled?: boolean;
}

export const useGetProject = ({
  projectId,
  enabled = true,
}: UseGetProjectProps) => {
  const sanitizedProjectId = projectId?.trim() ? projectId.trim() : undefined;

  const query = useQuery({
    queryKey: ["project", sanitizedProjectId],
    enabled: enabled && Boolean(sanitizedProjectId),
    queryFn: async () => {
      if (!sanitizedProjectId) {
        throw new Error("Project ID is required to fetch the project.");
      }

      const response = await client.api.projects[":projectId"].$get({
        param: { projectId: sanitizedProjectId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the project.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
