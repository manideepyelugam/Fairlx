import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { ProgramMilestone, MilestoneStatus } from "../types";

interface CreateMilestoneRequest {
  programId: string;
  name: string;
  description?: string;
  targetDate?: string;
  status?: MilestoneStatus;
}

interface CreateMilestoneResponse {
  data: ProgramMilestone;
}

export const useCreateMilestone = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<CreateMilestoneResponse, Error, CreateMilestoneRequest>({
    mutationFn: async ({ programId, name, description, targetDate, status }) => {
      const response = await client.api.programs[":programId"].milestones.$post({
        param: { programId },
        json: { name, description, targetDate, status },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to create milestone" }));
        throw new Error((error as { error: string }).error || "Failed to create milestone");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      toast.success("Milestone created");
      queryClient.invalidateQueries({ queryKey: ["program-milestones", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-analytics", programId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create milestone");
    },
  });

  return mutation;
};
