"use client";

import { Bell, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrent } from "@/features/auth/api/use-current";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";

import { useGetNotifications } from "../api/use-get-notifications";
import { useGetUnreadCount } from "../api/use-get-unread-count";
import { useMarkAllNotificationsRead } from "../api/use-mark-all-notifications-read";
import { NotificationItem } from "./notification-item";

export const NotificationBell = () => {
  const workspaceId = useWorkspaceId();
  const { data: currentUser } = useCurrent();

  const hasWorkspace = Boolean(workspaceId);

  const { data: notifications, isLoading } = useGetNotifications({
    workspaceId: workspaceId || "",
    limit: 20,
    enabled: hasWorkspace,
  });

  const { data: unreadCount } = useGetUnreadCount({
    workspaceId: workspaceId || "",
    enabled: hasWorkspace,
  });

  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllNotificationsRead();

  // Subscribe to realtime notifications
  useRealtimeNotifications({
    workspaceId: workspaceId || "",
    userId: currentUser?.$id || "",
    enabled: hasWorkspace && Boolean(currentUser?.$id),
    onNewNotification: (notification) => {
      toast(notification.title, {
        description: notification.summary,
        action: {
          label: "View",
          onClick: () => {
            window.location.href = notification.deepLinkUrl;
          },
        },
      });
    },
  });

  const handleMarkAllAsRead = () => {
    if (!workspaceId) return;
    markAllAsRead({ json: { workspaceId } });
  };

  const hasUnread = hasWorkspace && (unreadCount?.count ?? 0) > 0;
  const unreadCountValue = unreadCount?.count ?? 0;
  const notificationsList = notifications?.documents ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-semibold leading-none">
              {unreadCountValue > 99 ? "99+" : unreadCountValue}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 rounded-xl shadow-lg border"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {hasUnread && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-medium">
                {unreadCountValue}
              </span>
            )}
          </div>

          {hasUnread && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[420px]">
          {!hasWorkspace ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Select a workspace</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Notifications are workspace-specific
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notificationsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notificationsList.map((notification) => (
                <NotificationItem
                  key={notification.$id}
                  notification={notification}
                  workspaceId={workspaceId}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {hasWorkspace && notificationsList.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
              size="sm"
              asChild
            >
              <a href={`/workspaces/${workspaceId}/notifications`}>
                View all notifications
              </a>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

