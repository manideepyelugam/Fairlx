"use client";

import { useParams } from "next/navigation";

import { BacklogView } from "@/features/sprints/components/backlog-view";

export const BacklogClient = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  return <BacklogView workspaceId={workspaceId} projectId={projectId} />;
};
