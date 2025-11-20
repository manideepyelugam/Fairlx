import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

import { ProgramStatus } from "../types";

const sanitizeString = (value?: string | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

interface UseGetProgramsProps {
  workspaceId: string;
  status?: ProgramStatus | null;
  programLeadId?: string | null;
  search?: string | null;
}

export const useGetPrograms = ({
  workspaceId,
  status,
  programLeadId,
  search,
}: UseGetProgramsProps) => {
  const sanitizedWorkspaceId = sanitizeString(workspaceId);
  const sanitizedStatus = sanitizeString(status ?? undefined) as
    | ProgramStatus
    | undefined;
  const sanitizedProgramLeadId = sanitizeString(programLeadId ?? undefined);
  const sanitizedSearch = sanitizeString(search ?? undefined);

  const query = useQuery({
    queryKey: [
      "programs",
      sanitizedWorkspaceId,
      sanitizedStatus,
      sanitizedProgramLeadId,
      sanitizedSearch,
    ],
    enabled: Boolean(sanitizedWorkspaceId),
    queryFn: async () => {
      if (!sanitizedWorkspaceId) {
        throw new Error("workspaceId is required to fetch programs.");
      }

      const response = await client.api.programs.$get({
        query: {
          workspaceId: sanitizedWorkspaceId,
          status: sanitizedStatus,
          programLeadId: sanitizedProgramLeadId,
          search: sanitizedSearch,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch programs.");
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
