import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/rpc";
import { ProjectAIContext, ProjectAIAnswer } from "../types/ai-context";

// Query key factory
export const PROJECT_AI_QUERY_KEYS = {
  context: (projectId: string) => ["project-ai-context", projectId],
  questions: (projectId: string) => ["project-ai-questions", projectId],
};

// Hook to get AI context for a project
export const useGetProjectAIContext = (projectId: string, workspaceId: string) => {
  return useQuery<{ data: ProjectAIContext }>({
    queryKey: PROJECT_AI_QUERY_KEYS.context(projectId),
    queryFn: async () => {
      const response = await client.api["project-docs"].ai.context.$get({
        query: { projectId, workspaceId },
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to fetch AI context");
      }

      return await response.json();
    },
    enabled: !!projectId && !!workspaceId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Hook to ask a question about the project
export const useAskProjectQuestion = () => {
  return useMutation<
    { data: ProjectAIAnswer },
    Error,
    { projectId: string; workspaceId: string; question: string }
  >({
    mutationFn: async ({ projectId, workspaceId, question }) => {
      const response = await client.api["project-docs"].ai.ask.$post({
        json: { projectId, workspaceId, question },
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to get AI response");
      }

      return await response.json();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to get AI response");
    },
  });
};
