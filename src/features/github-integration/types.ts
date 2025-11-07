import { Models } from "node-appwrite";

export type GitHubRepository = Models.Document & {
  projectId: string;
  githubUrl: string;
  repositoryName: string;
  owner: string;
  branch: string;
  accessToken?: string;
  lastSyncedAt: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  error?: string;
};

export type CodeDocumentation = Models.Document & {
  projectId: string;
  content: string;
  generatedAt: string;
  fileStructure?: string;
  mermaidDiagram?: string;
};

export type CommitSummary = Models.Document & {
  projectId: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  summary: string;
  filesChanged: number;
  additions: number;
  deletions: number;
};

export type CodebaseQuestion = Models.Document & {
  projectId: string;
  userId: string;
  question: string;
  answer: string;
  timestamp: string;
  upvotes: number;
};

export type FileAnalysis = {
  path: string;
  summary: string;
  language: string;
  lines: number;
};
