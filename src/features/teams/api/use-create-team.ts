import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { Team, TeamVisibility } from "../types";

interface CreateTeamRequest {
  json: {
    name: string;
    workspaceId: string;
    description?: string;
    programId?: string;
    teamLeadId?: string;
    imageUrl?: string;
    visibility?: TeamVisibility;
  };
}

interface CreateTeamResponse {
  data: Team;
}

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<CreateTeamResponse, Error, CreateTeamRequest>({
    mutationFn: async ({ json }) => {
      const response = await client.api.teams.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create team.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Team created.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
    onError: () => {
      toast.error("Failed to create team.");
    },
  });

  return mutation;
};
