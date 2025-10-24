import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UseGetWorkspaceProps {
  workspaceId?: string | null;
  enabled?: boolean;
}

export const useGetWorkspace = ({
  workspaceId,
  enabled = true,
}: UseGetWorkspaceProps) => {
  const sanitizedWorkspaceId = workspaceId?.trim()
    ? workspaceId.trim()
    : undefined;

  const query = useQuery({
    queryKey: ["workspace", sanitizedWorkspaceId],
    enabled: enabled && Boolean(sanitizedWorkspaceId),
    queryFn: async () => {
      if (!sanitizedWorkspaceId) {
        throw new Error("Workspace ID is required to fetch the workspace.");
      }

      const response = await client.api.workspaces[":workspaceId"].$get({
        param: { workspaceId: sanitizedWorkspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the workspace.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
