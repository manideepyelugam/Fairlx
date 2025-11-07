"use client";

import { useState, useEffect } from "react";
import { Github, BookOpen, MessageSquare, GitCommit, Loader2, ExternalLink, Settings, FileText } from "lucide-react";

import { PageLoader } from "@/components/page-loader";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { 
  ConnectRepository,
  DocumentationView,
  CodebaseQA,
  CommitHistory
} from "@/features/github-integration/components";
import { useGetRepository } from "@/features/github-integration";

export const GitHubIntegrationClient = () => {
  const projectId = useProjectId();
  const { data: repository, isLoading } = useGetRepository(projectId);
  const [commitsCount, setCommitsCount] = useState(0);

  // Load commits count from localStorage
  useEffect(() => {
    const cached = localStorage.getItem(`commits_${projectId}`);
    if (cached) {
      try {
        const commits = JSON.parse(cached);
        setCommitsCount(commits.length);
      } catch (error) {
        console.error("Failed to parse cached commits:", error);
      }
    }
  }, [projectId]);

  if (isLoading) {
    return <PageLoader />;
  }

  // No repository connected - show connection UI
  if (!repository) {
    return (
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              GitHub Integration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your GitHub repository to unlock AI-powered code insights
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Github className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Connect GitHub Repository</CardTitle>
            <CardDescription>
              Link a GitHub repository to generate documentation, analyze code, and get AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectRepository projectId={projectId} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">Auto Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically generate comprehensive documentation from your codebase using AI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">Ask Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ask natural language questions about your codebase and get instant answers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <GitCommit className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle className="text-lg">Commit Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get AI-generated summaries of commits to understand changes quickly
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Repository connected - show full interface
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            GitHub Integration
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Github className="h-4 w-4" />
              <span className="font-medium">{repository.repositoryName}</span>
              <span className="text-xs">•</span>
              <span className="text-xs">Branch: {repository.branch}</span>
            </div>
            <a
              href={repository.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3" />
              View on GitHub
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {repository.status === "syncing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}

          {repository.status === "error" && (
            <div className="text-sm text-destructive">
              Error: {repository.error}
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Repository Details
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Repository Details</SheetTitle>
                <SheetDescription>
                  View and manage repository connection
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Owner</p>
                    <p className="text-sm text-muted-foreground">{repository.owner}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Repository</p>
                    <p className="text-sm text-muted-foreground">{repository.repositoryName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Branch</p>
                    <p className="text-sm text-muted-foreground">{repository.branch}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">GitHub URL</p>
                    <a
                      href={repository.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 break-all"
                    >
                      {repository.githubUrl}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Connected At</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(repository.$createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Synced</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(repository.lastSyncedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground capitalize">{repository.status}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <ConnectRepository projectId={projectId} isUpdate />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>AI-Generated Documentation</DialogTitle>
                <DialogDescription>
                  Comprehensive documentation generated from your codebase
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                <DocumentationView projectId={projectId} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <CodebaseQA projectId={projectId} commitsCount={commitsCount} />
        <CommitHistory projectId={projectId} />
      </div>
    </div>
  );
};
