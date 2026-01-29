import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { ProgramMilestone, MilestoneStatus } from "../types";

interface UpdateMilestoneRequest {
  programId: string;
  milestoneId: string;
  name?: string;
  description?: string | null;
  targetDate?: string | null;
  status?: MilestoneStatus;
  progress?: number;
  position?: number;
}

interface UpdateMilestoneResponse {
  data: ProgramMilestone;
}

export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<UpdateMilestoneResponse, Error, UpdateMilestoneRequest>({
    mutationFn: async ({ programId, milestoneId, ...updates }) => {
      const response = await client.api.programs[":programId"].milestones[":milestoneId"].$patch({
        param: { programId, milestoneId },
        json: updates,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to update milestone" }));
        throw new Error((error as { error: string }).error || "Failed to update milestone");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      toast.success("Milestone updated");
      queryClient.invalidateQueries({ queryKey: ["program-milestones", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-analytics", programId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update milestone");
    },
  });

  return mutation;
};
