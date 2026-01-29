import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { ProgramMember, ProgramMemberRole } from "../types";

interface UpdateProgramMemberRequest {
  programId: string;
  memberId: string;
  role: ProgramMemberRole;
}

interface UpdateProgramMemberResponse {
  data: ProgramMember;
}

export const useUpdateProgramMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<UpdateProgramMemberResponse, Error, UpdateProgramMemberRequest>({
    mutationFn: async ({ programId, memberId, role }) => {
      const response = await client.api.programs[":programId"].members[":memberId"].$patch({
        param: { programId, memberId },
        json: { role },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to update member" }));
        throw new Error((error as { error: string }).error || "Failed to update member");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      toast.success("Member role updated");
      queryClient.invalidateQueries({ queryKey: ["program-members", programId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update member role");
    },
  });

  return mutation;
};

// Alias for consistent naming
export const useUpdateProgramMemberRole = useUpdateProgramMember;
