import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface DeleteMilestoneRequest {
  programId: string;
  milestoneId: string;
}

interface DeleteMilestoneResponse {
  data: { $id: string };
}

export const useDeleteMilestone = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<DeleteMilestoneResponse, Error, DeleteMilestoneRequest>({
    mutationFn: async ({ programId, milestoneId }) => {
      const response = await client.api.programs[":programId"].milestones[":milestoneId"].$delete({
        param: { programId, milestoneId },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to delete milestone" }));
        throw new Error((error as { error: string }).error || "Failed to delete milestone");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      toast.success("Milestone deleted");
      queryClient.invalidateQueries({ queryKey: ["program-milestones", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-analytics", programId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete milestone");
    },
  });

  return mutation;
};
