"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  Trash2,
  CheckCircle2,
  FileText,
  Paperclip,
  Calendar,
  Flag,
  ArrowRight,
  User,
  AtSign,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { PopulatedNotification, NotificationType, NotificationMetadata } from "../types";
import { useMarkNotificationRead } from "../api/use-mark-notification-read";
import { useDeleteNotification } from "../api/use-delete-notification";

interface NotificationItemProps {
  notification: PopulatedNotification;
  workspaceId: string;
}

const getNotificationStyle = (type: NotificationType) => {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return {
        icon: User,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
        badge: "Assigned",
        badgeVariant: "default" as const,
      };
    case NotificationType.TASK_STATUS_CHANGED:
      return {
        icon: ArrowRight,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-950",
        badge: "Status Changed",
        badgeVariant: "secondary" as const,
      };
    case NotificationType.TASK_COMPLETED:
      return {
        icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-950",
        badge: "Completed",
        badgeVariant: "default" as const,
      };
    case NotificationType.TASK_PRIORITY_CHANGED:
      return {
        icon: Flag,
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-100 dark:bg-orange-950",
        badge: "Priority",
        badgeVariant: "secondary" as const,
      };
    case NotificationType.TASK_DUE_DATE_CHANGED:
      return {
        icon: Calendar,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-950",
        badge: "Due Date",
        badgeVariant: "secondary" as const,
      };
    case NotificationType.TASK_ATTACHMENT_ADDED:
      return {
        icon: Paperclip,
        color: "text-cyan-600 dark:text-cyan-400",
        bgColor: "bg-cyan-100 dark:bg-cyan-950",
        badge: "Attachment Added",
        badgeVariant: "secondary" as const,
      };
    case NotificationType.TASK_ATTACHMENT_DELETED:
      return {
        icon: Trash2,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-950",
        badge: "Attachment Removed",
        badgeVariant: "destructive" as const,
      };
    case NotificationType.TASK_MENTION:
      return {
        icon: AtSign,
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
        badge: "Mentioned",
        badgeVariant: "default" as const,
      };
    case NotificationType.TASK_UPDATED:
      return {
        icon: FileText,
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-950",
        badge: "Updated",
        badgeVariant: "outline" as const,
      };
    default:
      return {
        icon: Bell,
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-950",
        badge: "Notification",
        badgeVariant: "outline" as const,
      };
  }
};

const formatMetadata = (metadata?: string): NotificationMetadata | null => {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
};

const renderDetailedInfo = (type: NotificationType, metadata: NotificationMetadata | null) => {
  if (!metadata) return null;

  switch (type) {
    case NotificationType.TASK_STATUS_CHANGED:
      if (metadata.oldStatus && metadata.newStatus) {
        return (
          <div className="flex items-center gap-2 text-xs mt-1">
            <Badge variant="outline" className="text-xs">
              {metadata.oldStatus}
            </Badge>
            <ArrowRight className="size-3 text-muted-foreground" />
            <Badge variant="default" className="text-xs">
              {metadata.newStatus}
            </Badge>
          </div>
        );
      }
      break;

    case NotificationType.TASK_PRIORITY_CHANGED:
      if (metadata.oldPriority && metadata.newPriority) {
        return (
          <div className="flex items-center gap-2 text-xs mt-1">
            <span className="text-muted-foreground">Priority:</span>
            <Badge variant="outline" className="text-xs">
              {metadata.oldPriority}
            </Badge>
            <ArrowRight className="size-3 text-muted-foreground" />
            <Badge variant="destructive" className="text-xs">
              {metadata.newPriority}
            </Badge>
          </div>
        );
      }
      break;

    case NotificationType.TASK_DUE_DATE_CHANGED:
      if (metadata.newDueDate) {
        return (
          <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
            <Calendar className="size-3" />
            <span>New due: {new Date(metadata.newDueDate).toLocaleDateString()}</span>
          </div>
        );
      }
      break;

    case NotificationType.TASK_ATTACHMENT_ADDED:
      if (metadata.attachmentName) {
        return (
          <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
            <Paperclip className="size-3" />
            <span className="truncate">{metadata.attachmentName}</span>
            {metadata.attachmentSize && (
              <span className="text-xs">
                ({(metadata.attachmentSize / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        );
      }
      break;

    case NotificationType.TASK_UPDATED:
      if (metadata.changes && metadata.changes.length > 0) {
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {metadata.changes.map((change, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {change}
              </Badge>
            ))}
          </div>
        );
      }
      break;
  }

  return null;
};

export const NotificationItem = ({
  notification,
  workspaceId,
}: NotificationItemProps) => {
  const { mutate: markAsRead, isPending: isMarkingRead } = useMarkNotificationRead();
  const { mutate: deleteNotification, isPending: isDeleting } = useDeleteNotification();

  const style = getNotificationStyle(notification.type);
  const Icon = style.icon;
  const metadata = formatMetadata(notification.metadata);

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!notification.read) {
      markAsRead({ param: { notificationId: notification.$id } });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification({ param: { notificationId: notification.$id } });
  };

  const taskLink = notification.taskId
    ? `/workspaces/${workspaceId}/tasks/${notification.taskId}`
    : "#";

  return (
    <Link href={taskLink}>
      <div
        className={cn(
          "relative flex items-start gap-3 p-4 hover:bg-accent/50 transition-all border-b group cursor-pointer",
          !notification.read && "bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-l-blue-500"
        )}
      >
        {/* Icon with colored background */}
        <div className={cn("flex-shrink-0 p-2 rounded-lg", style.bgColor)}>
          <Icon className={cn("size-5", style.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header with badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={style.badgeVariant} className="text-xs">
                {style.badge}
              </Badge>
              {!notification.read && (
                <div className="flex items-center gap-1">
                  <div className="size-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    New
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <p className="font-semibold text-sm leading-tight">
            {notification.title}
          </p>

          {/* Message */}
          <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
            {notification.message}
          </p>

          {/* Detailed metadata */}
          {renderDetailedInfo(notification.type, metadata)}

          {/* Task name if available */}
          {metadata?.taskName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <FileText className="size-3" />
              <span className="truncate font-medium">{metadata.taskName}</span>
            </div>
          )}

          {/* Footer with user and time */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {notification.triggeredByUser && (
                <>
                  <Avatar className="size-5 border">
                    <AvatarImage
                      src={notification.triggeredByUser.profileImageUrl || undefined}
                      alt={notification.triggeredByUser.name}
                    />
                    <AvatarFallback className="text-xs">
                      {notification.triggeredByUser.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground font-medium">
                    {notification.triggeredByUser.name}
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground">
                • {formatDistanceToNow(new Date(notification.$createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Action buttons (visible on hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={handleMarkAsRead}
                  disabled={isMarkingRead}
                  title="Mark as read"
                >
                  <Check className="size-3.5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete notification"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
