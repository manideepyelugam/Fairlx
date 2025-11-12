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
      const response = await client.api.programs.$post({ json } as any);

      if (!response.ok) {
        throw new Error("Failed to create program.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Program created.");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
    onError: () => {
      toast.error("Failed to create program.");
    },
  });

  return mutation;
};
