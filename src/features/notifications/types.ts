import { Models } from "node-appwrite";

export enum NotificationType {
  TASK_ASSIGNED = "task_assigned",
  TASK_UPDATED = "task_updated",
  TASK_COMPLETED = "task_completed",
  TASK_STATUS_CHANGED = "task_status_changed",
  TASK_PRIORITY_CHANGED = "task_priority_changed",
  TASK_DUE_DATE_CHANGED = "task_due_date_changed",
  TASK_DELETED = "task_deleted",
  TASK_COMMENT = "task_comment",
  TASK_MENTION = "task_mention",
  TASK_ATTACHMENT_ADDED = "task_attachment_added",
  TASK_ATTACHMENT_DELETED = "task_attachment_deleted",
}

export type Notification = Models.Document & {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  taskId: string;
  workspaceId: string;
  triggeredBy: string;
  metadata?: string; // JSON stringified
};

export type PopulatedNotification = Notification & {
  triggeredByUser?: {
    $id: string;
    name: string;
    email: string;
    profileImageUrl?: string | null;
  };
  task?: {
    $id: string;
    name: string;
  };
};

export type CreateNotificationDto = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId: string;
  workspaceId: string;
  triggeredBy: string;
  metadata?: Record<string, unknown>;
};

export type NotificationMetadata = {
  taskName?: string;
  projectName?: string;
  assigneeName?: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  oldPriority?: string;
  newPriority?: string;
  oldDueDate?: string;
  newDueDate?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  changes?: string[];
  previousAssignee?: string;
  newAssignee?: string;
  [key: string]: unknown;
};
