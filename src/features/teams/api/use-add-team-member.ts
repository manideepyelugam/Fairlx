import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { TeamMember, TeamMemberRole, TeamMemberAvailability } from "../types";

interface AddTeamMemberRequest {
  param: {
    teamId: string;
  };
  json: {
    teamId: string;
    memberId: string;
    role?: TeamMemberRole;
    availability?: TeamMemberAvailability;
  };
}

interface AddTeamMemberResponse {
  data: TeamMember;
}

export const useAddTeamMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<AddTeamMemberResponse, Error, AddTeamMemberRequest>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.teams[":teamId"].members.$post({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to add team member.");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Team member added.");
      queryClient.invalidateQueries({ queryKey: ["team-members", data.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", data.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => {
      toast.error("Failed to add team member.");
    },
  });

  return mutation;
};
