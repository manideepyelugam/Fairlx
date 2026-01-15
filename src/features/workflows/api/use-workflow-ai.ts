import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/rpc";
import { 
  WorkflowAIContext, 
  WorkflowAIAnswer, 
  WorkflowAIResponse 
} from "../types/ai-context";

// Query key factory
export const WORKFLOW_AI_QUERY_KEYS = {
  context: (workflowId: string) => ["workflow-ai-context", workflowId],
};

// Hook to get AI context for a workflow
export const useGetWorkflowAIContext = (workflowId: string, workspaceId: string) => {
  return useQuery<{ data: WorkflowAIContext }>({
    queryKey: WORKFLOW_AI_QUERY_KEYS.context(workflowId),
    queryFn: async () => {
      const response = await client.api["workflow-ai"].context.$get({
        query: { workflowId, workspaceId },
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to fetch AI context");
      }

      return await response.json();
    },
    enabled: !!workflowId && !!workspaceId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
};

// Hook to ask a question about the workflow
export const useAskWorkflowQuestion = () => {
  return useMutation<
    { data: WorkflowAIAnswer },
    Error,
    { workflowId: string; workspaceId: string; question: string }
  >({
    mutationFn: async ({ workflowId, workspaceId, question }) => {
      const response = await client.api["workflow-ai"].ask.$post({
        json: { workflowId, workspaceId, question },
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

// Hook to suggest a status via AI
export const useAISuggestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { data: WorkflowAIResponse },
    Error,
    { workflowId: string; workspaceId: string; prompt: string; autoExecute?: boolean }
  >({
    mutationFn: async ({ workflowId, workspaceId, prompt, autoExecute }) => {
      const response = await client.api["workflow-ai"]["suggest-status"].$post({
        json: { workflowId, workspaceId, prompt, autoExecute },
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to suggest status");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: WORKFLOW_AI_QUERY_KEYS.context(variables.workflowId) 
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate status suggestion");
    },
  });
};

// Hook to suggest a transition via AI
export const useAISuggestTransition = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { data: WorkflowAIResponse },
    Error,
    { workflowId: string; workspaceId: string; prompt: string; autoExecute?: boolean }
  >({
    mutationFn: async ({ workflowId, workspaceId, prompt, autoExecute }) => {
      const response = await client.api["workflow-ai"]["suggest-transition"].$post({
        json: { workflowId, workspaceId, prompt, autoExecute },
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to suggest transition");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: WORKFLOW_AI_QUERY_KEYS.context(variables.workflowId) 
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate transition suggestion");
    },
  });
};

// Hook to generate a workflow template via AI
export const useAIGenerateWorkflow = () => {
  return useMutation<
    { data: WorkflowAIResponse },
    Error,
    { workflowId: string; workspaceId: string; prompt: string }
  >({
    mutationFn: async ({ workflowId, workspaceId, prompt }) => {
      const response = await client.api["workflow-ai"]["generate-workflow"].$post({
        json: { workflowId, workspaceId, prompt },
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to generate workflow");
      }

      return await response.json();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate workflow template");
    },
  });
};

// Hook to analyze a workflow via AI
export const useAIAnalyzeWorkflow = () => {
  return useMutation<
    { data: WorkflowAIAnswer },
    Error,
    { workflowId: string; workspaceId: string }
  >({
    mutationFn: async ({ workflowId, workspaceId }) => {
      const response = await client.api["workflow-ai"].analyze.$post({
        json: { workflowId, workspaceId },
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to analyze workflow");
      }

      return await response.json();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to analyze workflow");
    },
  });
};
