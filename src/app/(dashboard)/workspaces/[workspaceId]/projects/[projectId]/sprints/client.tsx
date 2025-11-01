"use client";

import { useParams } from "next/navigation";

import { SprintBoard } from "@/features/sprints/components/sprint-board";

export const SprintClient = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  return <SprintBoard workspaceId={workspaceId} projectId={projectId} />;
};
