import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface RemoveProgramMemberRequest {
  programId: string;
  memberId: string;
}

interface RemoveProgramMemberResponse {
  data: { $id: string };
}

export const useRemoveProgramMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<RemoveProgramMemberResponse, Error, RemoveProgramMemberRequest>({
    mutationFn: async ({ programId, memberId }) => {
      const response = await client.api.programs[":programId"].members[":memberId"].$delete({
        param: { programId, memberId },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to remove member" }));
        throw new Error((error as { error: string }).error || "Failed to remove member");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      toast.success("Member removed from program");
      queryClient.invalidateQueries({ queryKey: ["program-members", programId] });
      queryClient.invalidateQueries({ queryKey: ["programs", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-analytics", programId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  return mutation;
};
