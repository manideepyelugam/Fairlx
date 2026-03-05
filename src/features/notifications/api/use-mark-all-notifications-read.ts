import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";
import { PopulatedNotification } from "../types";

type ResponseType = InferResponseType<
  (typeof client.api.notifications)["read-all"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.notifications)["read-all"]["$patch"]
>;

type NotificationsData = {
  documents: PopulatedNotification[];
  total: number;
};

type ContextType = {
  previousNotifications: Map<string, NotificationsData | undefined>;
  previousUnreadCount: { count: number } | undefined;
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, ContextType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.notifications["read-all"].$patch({
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      return await response.json();
    },
    onMutate: async ({ json }) => {
      const workspaceId = json.workspaceId;

      // Cancel outgoing fetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Snapshot all notification queries for rollback
      const previousNotifications = new Map<string, NotificationsData | undefined>();
      const queries = queryClient.getQueriesData<NotificationsData>({
        queryKey: ["notifications", workspaceId],
      });
      queries.forEach(([key, data]) => {
        previousNotifications.set(JSON.stringify(key), data);
      });

      // Snapshot unread count
      const previousUnreadCount = queryClient.getQueryData<{ count: number }>([
        "notifications",
        "unread-count",
        workspaceId,
      ]);

      // Optimistically clear all notifications
      queryClient.setQueriesData<NotificationsData>(
        { queryKey: ["notifications", workspaceId] },
        (old) => {
          if (!old) return old;
          return { documents: [], total: 0 };
        }
      );

      // Optimistically set unread count to 0
      queryClient.setQueryData(
        ["notifications", "unread-count", workspaceId],
        { count: 0 }
      );

      return { previousNotifications, previousUnreadCount };
    },
    onError: (_err, { json }, context) => {
      const workspaceId = json.workspaceId;
      // Rollback on error
      if (context?.previousNotifications) {
        context.previousNotifications.forEach((data, keyStr) => {
          const key = JSON.parse(keyStr);
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          ["notifications", "unread-count", workspaceId],
          context.previousUnreadCount
        );
      }
      toast.error("Failed to mark all notifications as read");
    },
    onSettled: (_data, _err, { json }) => {
      // Sync with server in background
      queryClient.invalidateQueries({ queryKey: ["notifications", json.workspaceId] });
    },
  });

  return mutation;
};
