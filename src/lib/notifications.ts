import { ID, Models, Databases, Query } from "node-appwrite";
import { DATABASE_ID, NOTIFICATIONS_ID, MEMBERS_ID } from "@/config";
import { Task } from "@/features/tasks/types";

export type NotificationType = 
  | "task_assigned" 
  | "task_updated" 
  | "task_completed" 
  | "task_status_changed"
  | "task_priority_changed"
  | "task_due_date_changed"
  | "task_attachment_added"
  | "task_attachment_deleted";

interface CreateNotificationParams {
  databases: Databases;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId: string;
  workspaceId: string;
  triggeredBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  databases,
  userId,
  type,
  title,
  message,
  taskId,
  workspaceId,
  triggeredBy,
  metadata = {},
}: CreateNotificationParams): Promise<Models.Document> {
  return await databases.createDocument(
    DATABASE_ID,
    NOTIFICATIONS_ID,
    ID.unique(),
    {
      userId,
      type,
      title,
      message,
      taskId,
      workspaceId,
      triggeredBy,
      metadata: JSON.stringify(metadata), // Convert object to string
      read: false,
    }
  );
}

/**
 * Notify assignees about a task change
 */
export async function notifyTaskAssignees({
  databases,
  task,
  triggeredByUserId,
  triggeredByName,
  notificationType,
  workspaceId,
  metadata: extraMetadata,
}: {
  databases: Databases;
  task: Task;
  triggeredByUserId: string;
  triggeredByName: string;
  notificationType: NotificationType;
  workspaceId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const assigneeIds = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);

    if (assigneeIds.length === 0) {
      return;
    }

    // Create notification title and message based on type
    let title: string;
    let message: string;

    switch (notificationType) {
      case "task_assigned":
        title = "New Task Assigned";
        message = `${triggeredByName} assigned you to "${task.name}"`;
        break;
      case "task_completed":
        title = "Task Completed";
        message = `${triggeredByName} marked "${task.name}" as completed`;
        break;
      case "task_status_changed":
        title = "Task Status Changed";
        message = `${triggeredByName} changed status of "${task.name}"`;
        break;
      case "task_priority_changed":
        title = "Task Priority Changed";
        message = `${triggeredByName} changed priority of "${task.name}"`;
        break;
      case "task_due_date_changed":
        title = "Due Date Changed";
        message = `${triggeredByName} updated the due date for "${task.name}"`;
        break;
      case "task_attachment_added":
        title = "Attachment Added";
        message = `${triggeredByName} added an attachment to "${task.name}"`;
        break;
      case "task_attachment_deleted":
        title = "Attachment Removed";
        message = `${triggeredByName} removed an attachment from "${task.name}"`;
        break;
      case "task_updated":
      default:
        title = "Task Updated";
        message = `${triggeredByName} updated "${task.name}"`;
        break;
    }

    // Create notifications for each assignee
    const notificationPromises = assigneeIds.map(async (assigneeId: string) => {
      // Don't notify the user who made the change
      if (assigneeId === triggeredByUserId) {
        return;
      }
      
      try {
        await createNotification({
          databases,
          userId: assigneeId,
          type: notificationType,
          title,
          message,
          taskId: task.$id,
          workspaceId,
          triggeredBy: triggeredByUserId,
          metadata: {
            taskName: task.name,
            taskStatus: task.status,
            projectId: task.projectId,
            ...extraMetadata,
          },
        });
      } catch {
        // Silently fail - notifications are non-critical
      }
    });

    await Promise.all(notificationPromises);
  } catch {
    // Silently fail - notifications are non-critical
  }
}

/**
 * Notify workspace admins about a task change
 */
export async function notifyWorkspaceAdmins({
  databases,
  task,
  triggeredByUserId,
  triggeredByName,
  notificationType,
  workspaceId,
  metadata: extraMetadata,
}: {
  databases: Databases;
  task: Task;
  triggeredByUserId: string;
  triggeredByName: string;
  notificationType: NotificationType;
  workspaceId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Get all workspace members
    const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
      Query.equal("workspaceId", workspaceId),
      Query.equal("role", "ADMIN"),
    ]);

    if (members.documents.length === 0) {
      return;
    }

    let title: string;
    let message: string;

    switch (notificationType) {
      case "task_assigned":
        title = "New Task Created";
        message = `${triggeredByName} created a new task "${task.name}"`;
        break;
      case "task_completed":
        title = "Task Completed";
        message = `${triggeredByName} completed "${task.name}"`;
        break;
      case "task_status_changed":
        title = "Task Status Changed";
        message = `${triggeredByName} changed status of "${task.name}"`;
        break;
      case "task_priority_changed":
        title = "Task Priority Changed";
        message = `${triggeredByName} changed priority of "${task.name}"`;
        break;
      case "task_due_date_changed":
        title = "Due Date Changed";
        message = `${triggeredByName} updated the due date for "${task.name}"`;
        break;
      case "task_attachment_added":
        title = "Attachment Added";
        message = `${triggeredByName} added an attachment to "${task.name}"`;
        break;
      case "task_attachment_deleted":
        title = "Attachment Removed";
        message = `${triggeredByName} removed an attachment from "${task.name}"`;
        break;
      case "task_updated":
      default:
        title = "Task Updated";
        message = `${triggeredByName} updated "${task.name}"`;
        break;
    }

    // Create notifications for admin members
    const notificationPromises = members.documents.map(async (member: Models.Document) => {
      // Don't notify the user who made the change
      if (member.userId === triggeredByUserId) {
        return;
      }

      try {
        await createNotification({
          databases,
          userId: member.userId,
          type: notificationType,
          title,
          message,
          taskId: task.$id,
          workspaceId,
          triggeredBy: triggeredByUserId,
          metadata: {
            taskName: task.name,
            taskStatus: task.status,
            projectId: task.projectId,
            ...extraMetadata,
          },
        });
      } catch {
        // Silently fail - notifications are non-critical
      }
    });

    await Promise.all(notificationPromises);
  } catch {
    // Silently fail - notifications are non-critical
  }
}
