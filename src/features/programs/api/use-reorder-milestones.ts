import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface ReorderMilestonesRequest {
  programId: string;
  milestoneIds: string[];
}

interface ReorderMilestonesResponse {
  data: { success: boolean };
}

export const useReorderMilestones = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ReorderMilestonesResponse, Error, ReorderMilestonesRequest>({
    mutationFn: async ({ programId, milestoneIds }) => {
      const response = await client.api.programs[":programId"].milestones.reorder.$patch({
        param: { programId },
        json: { milestoneIds },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to reorder milestones" }));
        throw new Error((error as { error: string }).error || "Failed to reorder milestones");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      queryClient.invalidateQueries({ queryKey: ["program-milestones", programId] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reorder milestones");
    },
  });

  return mutation;
};
