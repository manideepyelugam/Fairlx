import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

interface UploadAttachmentRequest {
  form: FormData;
}

interface UploadAttachmentResponse {
  data: {
    $id: string;
    name: string;
    size: number;
    mimeType: string;
    fileId: string;
    taskId: string;
    workspaceId: string;
    uploadedBy: string;
    uploadedAt: string;
    url: string;
  };
}

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<UploadAttachmentResponse, Error, UploadAttachmentRequest>({
    mutationFn: async ({ form }) => {
      const response = await client.api.attachments.upload["$post"]({ form });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to upload attachment");
      }

      return await response.json() as UploadAttachmentResponse;
    },
    onSuccess: () => {
      toast.success("Attachment uploaded successfully");
      
      // Invalidate attachments queries
      queryClient.invalidateQueries({
        queryKey: ["attachments"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload attachment");
    },
  });

  return mutation;
};