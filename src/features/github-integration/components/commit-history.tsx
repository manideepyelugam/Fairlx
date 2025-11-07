"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { GitCommit, Loader2, RefreshCw, ChevronDown, ChevronRight, FileCode, FileText, FilePlus, FileMinus, FileEdit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useFetchCommits, useGetRepository } from "../api/use-github";

interface CommitHistoryProps {
  projectId: string;
}

interface CommitData {
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

const CommitCard = ({ commit }: { commit: CommitData }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          {commit.authorAvatar && (
            <AvatarImage src={commit.authorAvatar} alt={commit.author} />
          )}
          <AvatarFallback className="text-xs">
            {getInitials(commit.author)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{commit.message}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{commit.author}</span>
                <span>•</span>
                <span>{formatDate(commit.date)}</span>
                <span>•</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {commit.hash.slice(0, 7)}
                </code>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {commit.filesChanged > 0 && (
            <div className="flex items-center gap-3 mt-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <FileCode className="h-3 w-3" />
                {commit.filesChanged} files
              </Badge>
              {commit.additions > 0 && (
                <span className="text-green-600">+{commit.additions}</span>
              )}
              {commit.deletions > 0 && (
                <span className="text-red-600">-{commit.deletions}</span>
              )}
            </div>
          )}

          {expanded && commit.aiSummary && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  AI Summary
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{commit.aiSummary}</ReactMarkdown>
              </div>
            </div>
          )}

          {expanded && !commit.aiSummary && (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              No AI summary available for this commit
            </div>
          )}

          {expanded && commit.files && commit.files.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="h-3.5 w-3.5" />
                <span className="text-xs font-medium text-muted-foreground">
                  Files Changed ({commit.files.length})
                </span>
              </div>
              <div className="space-y-2">
                {commit.files.map((file, idx) => (
                  <div key={idx} className="bg-muted/50 rounded p-2 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {file.status === "added" && <FilePlus className="h-3 w-3 text-green-600 flex-shrink-0" />}
                        {file.status === "removed" && <FileMinus className="h-3 w-3 text-red-600 flex-shrink-0" />}
                        {file.status === "modified" && <FileEdit className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                        {file.status === "renamed" && <FileText className="h-3 w-3 text-yellow-600 flex-shrink-0" />}
                        <code className="font-mono truncate">{file.filename}</code>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {file.additions > 0 && (
                          <span className="text-green-600">+{file.additions}</span>
                        )}
                        {file.deletions > 0 && (
                          <span className="text-red-600">-{file.deletions}</span>
                        )}
                      </div>
                    </div>
                    {file.patch && (
                      <pre className="text-[10px] bg-background rounded p-2 overflow-x-auto max-h-40 mt-1">
                        <code>{file.patch}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CommitHistory = ({ projectId }: CommitHistoryProps) => {
  const { data: repository } = useGetRepository(projectId);
  const { mutate: fetchCommits, isPending: isFetching } = useFetchCommits();
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load commits from localStorage on mount and validate against current repo
  useEffect(() => {
    const cached = localStorage.getItem(`commits_${projectId}`);
    const cachedRepoInfo = localStorage.getItem(`commits_repo_${projectId}`);
    
    if (cached && cachedRepoInfo && repository) {
      try {
        const parsedCommits = JSON.parse(cached);
        const parsedRepoInfo = JSON.parse(cachedRepoInfo);
        
        // Check if repository URL or branch has changed
        const repoChanged = parsedRepoInfo.githubUrl !== repository.githubUrl || 
                           parsedRepoInfo.branch !== repository.branch;
        
        if (repoChanged) {
          // Clear cache if repository changed
          console.log(`[Cache] Repository changed, clearing old commits cache`);
          localStorage.removeItem(`commits_${projectId}`);
          localStorage.removeItem(`commits_repo_${projectId}`);
          setCommits([]);
        } else {
          setCommits(parsedCommits);
          console.log(`[Cache] Loaded ${parsedCommits.length} commits from localStorage`);
        }
      } catch (error) {
        console.error("Failed to parse cached commits:", error);
        localStorage.removeItem(`commits_${projectId}`);
        localStorage.removeItem(`commits_repo_${projectId}`);
      }
    }
    setIsLoadingCache(false);
  }, [projectId, repository]);

  const handleFetch = () => {
    console.log(`[GitHub API] User clicked Refetch - fetching commits...`);
    fetchCommits(
      {
        json: { projectId, limit: 20 },
      },
      {
        onSuccess: (response) => {
          if (response.data?.summaries) {
            const newCommits = response.data.summaries;
            setCommits(newCommits);
            // Save to localStorage with repository info
            localStorage.setItem(`commits_${projectId}`, JSON.stringify(newCommits));
            if (repository) {
              localStorage.setItem(`commits_repo_${projectId}`, JSON.stringify({
                githubUrl: repository.githubUrl,
                branch: repository.branch,
              }));
            }
            console.log(`[Cache] Saved ${newCommits.length} commits to localStorage`);
          }
        },
      }
    );
  };

  // Show loading state only while checking cache
  if (isLoadingCache) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commit History</CardTitle>
          <CardDescription>
            Loading cached commits...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Commit History</CardTitle>
            <CardDescription>
              {commits.length > 0 
                ? `${commits.length} commits loaded • ${new Set(commits.map((c: CommitData) => c.author)).size} contributors`
                : "No commits cached. Click Refetch to load."}
            </CardDescription>
          </div>
          <Button
            onClick={handleFetch}
            disabled={isFetching}
            variant="outline"
            size="sm"
          >
            {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isFetching && <RefreshCw className="mr-2 h-4 w-4" />}
            {commits.length === 0 ? "Fetch Commits" : "Refetch"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {commits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No commits loaded yet</p>
            <p className="text-xs mt-1">Click the button above to fetch commits</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {commits.map((commit: CommitData) => (
                <CommitCard key={commit.hash} commit={commit} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
