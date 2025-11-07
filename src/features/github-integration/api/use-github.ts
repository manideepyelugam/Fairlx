import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";
import { GITHUB_INTEGRATION_QUERY_KEYS } from "../constants";

// Link Repository
type LinkRepositoryRequest = InferRequestType<
  typeof client.api.github.repository.link["$post"]
>;
type LinkRepositoryResponse = InferResponseType<
  typeof client.api.github.repository.link["$post"],
  200
>;

export const useLinkRepository = () => {
  const queryClient = useQueryClient();

  return useMutation<LinkRepositoryResponse, Error, LinkRepositoryRequest>({
    mutationFn: async ({ json }) => {
      const response = await client.api.github.repository.link["$post"]({ json });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to link repository");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Repository linked successfully");
      
      // Clear localStorage cache for commits
      localStorage.removeItem(`commits_${data.projectId}`);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: GITHUB_INTEGRATION_QUERY_KEYS.repository(data.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: GITHUB_INTEGRATION_QUERY_KEYS.documentation(data.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: GITHUB_INTEGRATION_QUERY_KEYS.commits(data.projectId),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to link repository");
    },
  });
};

// Get Repository
export const useGetRepository = (projectId: string) => {
  return useQuery({
    queryKey: GITHUB_INTEGRATION_QUERY_KEYS.repository(projectId),
    queryFn: async () => {
      const response = await client.api.github.repository.$get({
        query: { projectId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repository");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!projectId,
  });
};

// Disconnect Repository
type DisconnectRepositoryRequest = {
  param: { repositoryId: string };
  projectId: string;
};

export const useDisconnectRepository = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DisconnectRepositoryRequest>({
    mutationFn: async ({ param }) => {
      const response = await client.api.github.repository[":repositoryId"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect repository");
      }
    },
    onSuccess: (_, variables) => {
      toast.success("Repository disconnected");
      
      // Clear localStorage cache for this project
      localStorage.removeItem(`commits_${variables.projectId}`);
      localStorage.removeItem(`commits_repo_${variables.projectId}`);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["github-repo"],
      });
      queryClient.invalidateQueries({
        queryKey: GITHUB_INTEGRATION_QUERY_KEYS.documentation(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: GITHUB_INTEGRATION_QUERY_KEYS.commits(variables.projectId),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect repository");
    },
  });
};

// Generate Documentation
type GenerateDocumentationRequest = InferRequestType<
  typeof client.api.github.documentation.generate["$post"]
>;
type GenerateDocumentationResponse = InferResponseType<
  typeof client.api.github.documentation.generate["$post"],
  200
>;

export const useGenerateDocumentation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    GenerateDocumentationResponse,
    Error,
    GenerateDocumentationRequest
  >({
    mutationFn: async ({ json }) => {
      const response = await client.api.github.documentation.generate["$post"]({
        json,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to generate documentation");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Documentation generated successfully");
      queryClient.invalidateQueries({
        queryKey: GITHUB_INTEGRATION_QUERY_KEYS.documentation(data.projectId),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate documentation");
    },
  });
};

// Get Documentation
export const useGetDocumentation = (projectId: string) => {
  return useQuery({
    queryKey: GITHUB_INTEGRATION_QUERY_KEYS.documentation(projectId),
    queryFn: async () => {
      const response = await client.api.github.documentation["$get"]({
        query: { projectId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch documentation");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!projectId,
  });
};

// Fetch Commits with real-time AI summaries
type FetchCommitsRequest = InferRequestType<
  typeof client.api.github.commits.fetch["$post"]
>;
type FetchCommitsResponse = InferResponseType<
  typeof client.api.github.commits.fetch["$post"],
  200
>;

export const useFetchCommits = () => {
  return useMutation<FetchCommitsResponse, Error, FetchCommitsRequest>({
    mutationFn: async ({ json }) => {
      const response = await client.api.github.commits.fetch["$post"]({ json });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to fetch commits");
      }

      return await response.json();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to fetch commits");
    },
  });
};

// Ask Question with real-time AI response
type AskQuestionRequest = InferRequestType<
  typeof client.api.github.qa.ask["$post"]
>;
type AskQuestionResponse = InferResponseType<
  typeof client.api.github.qa.ask["$post"],
  200
>;

export const useAskQuestion = () => {
  return useMutation<AskQuestionResponse, Error, AskQuestionRequest>({
    mutationFn: async ({ json }) => {
      const response = await client.api.github.qa.ask["$post"]({ json });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to answer question");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Question answered");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to answer question");
    },
  });
};
