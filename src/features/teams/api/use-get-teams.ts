import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { QUERY_CONFIG } from "@/lib/query-config";

import { TeamVisibility } from "../types";

const sanitizeString = (value?: string | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

interface UseGetTeamsProps {
  workspaceId: string;
  spaceId?: string | null;
  programId?: string | null;
  visibility?: TeamVisibility | null;
  search?: string | null;
}

export const useGetTeams = ({
  workspaceId,
  spaceId,
  programId,
  visibility,
  search,
}: UseGetTeamsProps) => {
  const sanitizedWorkspaceId = sanitizeString(workspaceId);
  const sanitizedSpaceId = sanitizeString(spaceId ?? undefined);
  const sanitizedProgramId = sanitizeString(programId ?? undefined);
  const sanitizedVisibility = sanitizeString(visibility ?? undefined) as
    | TeamVisibility
    | undefined;
  const sanitizedSearch = sanitizeString(search ?? undefined);

  const query = useQuery({
    queryKey: [
      "teams",
      sanitizedWorkspaceId,
      sanitizedSpaceId,
      sanitizedProgramId,
      sanitizedVisibility,
      sanitizedSearch,
    ],
    enabled: Boolean(sanitizedWorkspaceId),
    staleTime: QUERY_CONFIG.SEMI_DYNAMIC.staleTime,
    gcTime: QUERY_CONFIG.SEMI_DYNAMIC.gcTime,
    queryFn: async () => {
      if (!sanitizedWorkspaceId) {
        throw new Error("workspaceId is required to fetch teams.");
      }

      const response = await client.api.teams.$get({
        query: {
          workspaceId: sanitizedWorkspaceId,
          spaceId: sanitizedSpaceId,
          programId: sanitizedProgramId,
          visibility: sanitizedVisibility,
          search: sanitizedSearch,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch teams.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
