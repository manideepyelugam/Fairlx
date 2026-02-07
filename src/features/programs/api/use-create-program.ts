import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { Program, ProgramStatus } from "../types";

interface CreateProgramRequest {
  json: {
    name: string;
    workspaceId: string;
    description?: string;
    imageUrl?: string;
    status?: ProgramStatus;
    startDate?: string;
    endDate?: string;
    programLeadId?: string;
  };
}

interface CreateProgramResponse {
  data: Program;
}

export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<CreateProgramResponse, Error, CreateProgramRequest>({
    mutationFn: async ({ json }) => {
      const response = await client.api.programs.$post({ json });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = (errorData as { error?: string })?.error || "Failed to create program.";
        throw new Error(errorMessage);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Program created.");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create program.");
    },
  });

  return mutation;
};
