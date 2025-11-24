export interface CommitSummary {
  hash: string;
  message: string;
  author: string;
  authorAvatar?: string | null;
  date: string;
  aiSummary: string | null;
  filesChanged: number;
  additions: number;
  deletions: number;
  url: string;
  files?: Array<{
    filename: string;
    status?: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}
