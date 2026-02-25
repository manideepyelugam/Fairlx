"use client";

import * as React from "react";
import { resolveIconSync } from "@/lib/resolve-icon";

import { Badge } from "@/components/ui/badge";
import { snakeCaseToTitleCase } from "@/lib/utils";



import { TaskStatus } from "@/features/tasks/types";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetCustomColumns } from "@/features/custom-columns/api/use-get-custom-columns";



interface StatusDisplayProps {
  status: string;
  projectId?: string;
}

export const StatusDisplay = ({ status, projectId, workspaceId: passedWorkspaceId }: StatusDisplayProps & { workspaceId?: string }) => {
  const currentWorkspaceId = useWorkspaceId();
  const workspaceId = passedWorkspaceId || currentWorkspaceId;
  const { data: customColumns = { documents: [] } } = useGetCustomColumns({
    workspaceId,
    projectId,
  });

  // Check if it's a default TaskStatus
  const isValidTaskStatus = Object.values(TaskStatus).includes(status as TaskStatus);

  if (isValidTaskStatus) {
    // Render default status with existing Badge variant
    return (
      <Badge variant={status as TaskStatus}>
        {snakeCaseToTitleCase(status)}
      </Badge>
    );
  }

  // Look for custom column
  const customColumn = customColumns.documents.find(col => col.$id === status);

  if (customColumn) {
    // Render custom column status
    const IconComponent = resolveIconSync(customColumn.icon);
    const icon = (
      <IconComponent
        className="size-3"
        style={{ color: customColumn.color }}
      />
    );

    return (
      <div className="inline-flex items-center gap-x-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        {icon}
        {customColumn.name}
      </div>
    );
  }

  // Fallback for unknown status
  return (
    <Badge variant="secondary">
      {status}
    </Badge>
  );
};
