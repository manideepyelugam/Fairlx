"use client";

import { useParams } from "next/navigation";

import { SprintBoard } from "@/features/sprints/components/sprint-board";
import { ProjectPermissionGuard } from "@/components/project-permission-guard";
import { ProjectPermissionKey } from "@/lib/permissions/types";

export const SprintClient = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  return (
    <ProjectPermissionGuard
      permission={ProjectPermissionKey.VIEW_SPRINTS}
      projectId={projectId}
      workspaceId={workspaceId}
      fallback={
        <div className="flex items-center justify-center h-[50vh]">
          <p className="text-muted-foreground text-sm">You don&apos;t have permission to view the Sprint Board.</p>
        </div>
      }
    >
      <SprintBoard workspaceId={workspaceId} projectId={projectId} />
    </ProjectPermissionGuard>
  );
};
