"use client";

import { CommentInput } from "./comment-input";

interface TaskCommentsProps {
  taskId: string;
  workspaceId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

export const TaskComments = ({
  taskId,
  workspaceId,
}: TaskCommentsProps) => {
  return (
    <CommentInput taskId={taskId} workspaceId={workspaceId} />
  );
};
