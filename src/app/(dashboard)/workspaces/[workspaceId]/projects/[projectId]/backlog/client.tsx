"use client";

import { useParams } from "next/navigation";

import EnhancedBacklogScreen from "@/features/sprints/components/enhanced-backlog-screen";

export const BacklogClient = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  return <EnhancedBacklogScreen workspaceId={workspaceId} projectId={projectId} />;
};
