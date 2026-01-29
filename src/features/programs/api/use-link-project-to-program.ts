import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

interface LinkProjectToProgramRequest {
  programId: string;
  projectId: string;
}

interface LinkProjectToProgramResponse {
  data: {
    projectId: string;
    programId: string;
    name: string;
  };
}

export const useLinkProjectToProgram = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<LinkProjectToProgramResponse, Error, LinkProjectToProgramRequest>({
    mutationFn: async ({ programId, projectId }) => {
      const response = await client.api.programs[":programId"].projects.$post({
        param: { programId },
        json: { projectId },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to link project" }));
        throw new Error((error as { error: string }).error || "Failed to link project");
      }

      return await response.json();
    },
    onSuccess: (data, { programId }) => {
      toast.success(`Project "${data.data.name}" linked to program`);
      queryClient.invalidateQueries({ queryKey: ["program-projects", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-available-projects", programId] });
      queryClient.invalidateQueries({ queryKey: ["programs", programId] });
      queryClient.invalidateQueries({ queryKey: ["program-analytics", programId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to link project");
    },
  });

  return mutation;
};
