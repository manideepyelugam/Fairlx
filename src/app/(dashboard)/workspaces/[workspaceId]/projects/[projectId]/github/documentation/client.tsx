"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DocumentationView } from "@/features/github-integration/components";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

export const GitHubDocumentationClient = () => {
  const projectId = useProjectId();
  const workspaceId = useWorkspaceId();

  const integrationPath = `/workspaces/${workspaceId}/projects/${projectId}/github`;

  return (
    <div className="h-full  flex flex-col">
      {/* Sticky Header with Gradient Border */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="xs" asChild className="-ml-2 h-7 px-2">
                <Link href={integrationPath} className="flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="text-xs">Back</span>
                </Link>
              </Button>
             
            </div>

          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <DocumentationView projectId={projectId} />
        </div>
      </div>
    </div>
  );
};
