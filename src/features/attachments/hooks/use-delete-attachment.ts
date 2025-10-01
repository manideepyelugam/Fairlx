import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

interface DeleteAttachmentRequest {
  param: { attachmentId: string };
  query: { workspaceId: string };
}

interface DeleteAttachmentResponse {
  data: { success: boolean };
}

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<DeleteAttachmentResponse, Error, DeleteAttachmentRequest>({
    mutationFn: async ({ param, query }) => {
      const response = await client.api.attachments[":attachmentId"]["$delete"]({
        param,
        query,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to delete attachment");
      }

      return await response.json() as DeleteAttachmentResponse;
    },
    onSuccess: () => {
      toast.success("Attachment deleted successfully");
      
      // Invalidate attachments queries
      queryClient.invalidateQueries({
        queryKey: ["attachments"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete attachment");
    },
  });

  return mutation;
};