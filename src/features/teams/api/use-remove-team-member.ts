import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface RemoveTeamMemberRequest {
  param: {
    teamId: string;
    memberId: string;
  };
}

interface RemoveTeamMemberResponse {
  data: {
    $id: string;
  };
}

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<RemoveTeamMemberResponse, Error, RemoveTeamMemberRequest>({
    mutationFn: async ({ param }) => {
      const response = await client.api.teams[":teamId"].members[
        ":memberId"
      ].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to remove team member.");
      }

      return await response.json();
    },
    onSuccess: (_, { param }) => {
      toast.success("Team member removed.");
      queryClient.invalidateQueries({ queryKey: ["team-members", param.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", param.teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => {
      toast.error("Failed to remove team member.");
    },
  });

  return mutation;
};
