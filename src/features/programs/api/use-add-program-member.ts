import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { ProgramMember, ProgramMemberRole } from "../types";

interface AddProgramMemberRequest {
  programId: string;
  userId: string;
  role: ProgramMemberRole;
}

interface AddProgramMemberResponse {
  data: ProgramMember;
}

export const useAddProgramMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<AddProgramMemberResponse, Error, AddProgramMemberRequest>({
    mutationFn: async ({ programId, userId, role }) => {
      const response = await client.api.programs[":programId"].members.$post({
        param: { programId },
        json: { userId, role },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to add member" }));
        throw new Error((error as { error: string }).error || "Failed to add member");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      toast.success("Member added to program");
      queryClient.invalidateQueries({ queryKey: ["program-members", programId] });
      queryClient.invalidateQueries({ queryKey: ["programs", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-analytics", programId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  return mutation;
};
