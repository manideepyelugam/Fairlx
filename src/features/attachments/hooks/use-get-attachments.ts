import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { Attachment } from "../types";

interface UseGetAttachmentsProps {
  taskId: string;
  workspaceId: string;
}

export const useGetAttachments = ({ taskId, workspaceId }: UseGetAttachmentsProps) => {
  const query = useQuery({
    queryKey: ["attachments", taskId, workspaceId],
    queryFn: async () => {
      const response = await client.api.attachments["$get"]({
        query: { taskId, workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attachments");
      }

      const { data } = await response.json() as { data: Attachment[] };
      return data;
    },
    enabled: !!taskId && !!workspaceId,
  });

  return query;
};