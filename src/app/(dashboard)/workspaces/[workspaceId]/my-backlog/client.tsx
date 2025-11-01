"use client";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { MyBacklogView } from "@/features/personal-backlog/components/my-backlog-view";

export const MyBacklogClient = () => {
  const workspaceId = useWorkspaceId();

  return (
    <div className="h-full flex flex-col">
      <MyBacklogView workspaceId={workspaceId} />
    </div>
  );
};
