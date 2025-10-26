"use client";

import { Bell, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { useGetNotifications } from "../api/use-get-notifications";
import { useGetUnreadCount } from "../api/use-get-unread-count";
import { useMarkAllNotificationsRead } from "../api/use-mark-all-notifications-read";
import { NotificationItem } from "./notification-item";

export const NotificationBell = () => {
  const workspaceId = useWorkspaceId();

  const { data: notifications, isLoading } = useGetNotifications({
    workspaceId,
    limit: 20,
  });

  const { data: unreadCount } = useGetUnreadCount({ workspaceId });
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllNotificationsRead();

  const handleMarkAllAsRead = () => {
    markAllAsRead({ json: { workspaceId } });
  };

  const hasUnread = (unreadCount?.count ?? 0) > 0;
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
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCountValue > 9 ? "9+" : unreadCountValue}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div>
            <h3 className="font-semibold text-base">Notifications</h3>
            {hasUnread && (
              <p className="text-xs text-muted-foreground">
                {unreadCountValue} unread
              </p>
            )}
          </div>

          {hasUnread && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="h-8 text-xs"
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

        <Separator />

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notificationsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;ll be notified when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y">
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
        {notificationsList.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs"
                size="sm"
                asChild
              >
                <a href={`/workspaces/${workspaceId}/notifications`}>
                  View all notifications
                </a>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
