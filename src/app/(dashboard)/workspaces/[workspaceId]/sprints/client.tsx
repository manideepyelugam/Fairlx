"use client";

import { useParams } from "next/navigation";

import { SprintBoard } from "@/features/sprints/components/sprint-board";

export const SprintClient = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  // For now, we'll use the first project or require selection
  // In a real app, you'd have project selection logic
  const projectId = ""; // This should come from context or URL

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Select a Project</h2>
          <p className="text-muted-foreground">
            Please select a project to view its sprint board
          </p>
        </div>
      </div>
    );
  }

  return <SprintBoard workspaceId={workspaceId} projectId={projectId} />;
};
