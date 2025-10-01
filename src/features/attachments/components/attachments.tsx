import { Paperclip } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetAttachments } from "../hooks/use-get-attachments";
import { AttachmentUpload } from "./attachment-upload";
import { AttachmentList } from "./attachment-list";

interface AttachmentsProps {
  taskId: string;
  workspaceId: string;
}

export const Attachments = ({ taskId, workspaceId }: AttachmentsProps) => {
  const { data: attachments, isLoading } = useGetAttachments({
    taskId,
    workspaceId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Separator />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AttachmentUpload taskId={taskId} workspaceId={workspaceId} />
        
        {attachments && attachments.length > 0 && (
          <>
            <Separator />
            <AttachmentList attachments={attachments} workspaceId={workspaceId} />
          </>
        )}
      </CardContent>
    </Card>
  );
};