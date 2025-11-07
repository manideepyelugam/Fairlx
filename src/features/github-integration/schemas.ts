import { z } from "zod";

export const connectGitHubRepoSchema = z.object({
  projectId: z.string(),
  githubUrl: z.string().url().refine(
    (url) => url.includes("github.com"),
    "Must be a valid GitHub repository URL"
  ),
  branch: z.string().default("main"),
  githubToken: z.string().optional(),
});

export const generateDocumentationSchema = z.object({
  projectId: z.string(),
});

export const askQuestionSchema = z.object({
  projectId: z.string(),
  question: z.string().min(10, "Question must be at least 10 characters"),
});

export const syncCommitsSchema = z.object({
  projectId: z.string(),
  limit: z.number().optional().default(15),
});

export const summarizeCommitSchema = z.object({
  projectId: z.string(),
  commitHash: z.string(),
});
