import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

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
  programId?: string | null;
  visibility?: TeamVisibility | null;
  search?: string | null;
}

export const useGetTeams = ({
  workspaceId,
  programId,
  visibility,
  search,
}: UseGetTeamsProps) => {
  const sanitizedWorkspaceId = sanitizeString(workspaceId);
  const sanitizedProgramId = sanitizeString(programId ?? undefined);
  const sanitizedVisibility = sanitizeString(visibility ?? undefined) as
    | TeamVisibility
    | undefined;
  const sanitizedSearch = sanitizeString(search ?? undefined);

  const query = useQuery({
    queryKey: [
      "teams",
      sanitizedWorkspaceId,
      sanitizedProgramId,
      sanitizedVisibility,
      sanitizedSearch,
    ],
    enabled: Boolean(sanitizedWorkspaceId),
    queryFn: async () => {
      if (!sanitizedWorkspaceId) {
        throw new Error("workspaceId is required to fetch teams.");
      }

      const response = await client.api.teams.$get({
        query: {
          workspaceId: sanitizedWorkspaceId,
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
