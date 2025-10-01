import { Attachments } from "@/features/attachments";

interface TaskAttachmentsProps {
  taskId: string;
  workspaceId: string;
}

export const TaskAttachments = ({ taskId, workspaceId }: TaskAttachmentsProps) => {
  return (
    <div className="space-y-6">
      <Attachments taskId={taskId} workspaceId={workspaceId} />
    </div>
  );
};