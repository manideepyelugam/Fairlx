import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface UnlinkProjectFromProgramRequest {
  programId: string;
  projectId: string;
}

interface UnlinkProjectFromProgramResponse {
  data: { projectId: string };
}

export const useUnlinkProjectFromProgram = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<UnlinkProjectFromProgramResponse, Error, UnlinkProjectFromProgramRequest>({
    mutationFn: async ({ programId, projectId }) => {
      const response = await client.api.programs[":programId"].projects[":projectId"].$delete({
        param: { programId, projectId },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to unlink project" }));
        throw new Error((error as { error: string }).error || "Failed to unlink project");
      }

      return await response.json();
    },
    onSuccess: (_, { programId }) => {
      toast.success("Project unlinked from program");
      queryClient.invalidateQueries({ queryKey: ["program-projects", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-available-projects", programId] });
      queryClient.invalidateQueries({ queryKey: ["programs", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-analytics", programId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unlink project");
    },
  });

  return mutation;
};
