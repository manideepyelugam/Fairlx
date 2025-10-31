import { ID, Models, Databases, Query } from "node-appwrite";
import { DATABASE_ID, NOTIFICATIONS_ID, MEMBERS_ID } from "@/config";
import { Task } from "@/features/tasks/types";
import { createAdminClient } from "@/lib/appwrite";

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
    },
    [
      `read("user:${userId}")`, // Allow the assigned user to read the notification
      `update("user:${userId}")`, // Allow the assigned user to update (mark as read)
      `delete("user:${userId}")` // Allow the assigned user to delete the notification
    ]
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
    // Use admin client to ensure we can create notifications for any user
    const { databases: adminDatabases } = await createAdminClient();
    
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

    // Map notification types to supported database enum values
    const supportedTypes = ["task_assigned", "task_updated", "task_completed", "task_deleted", "task_comment"];
    const dbNotificationType = supportedTypes.includes(notificationType) ? notificationType : "task_updated";

    // Create notifications for each assignee
    const notificationPromises = assigneeIds.map(async (assigneeId: string) => {
      // Don't notify the user who made the change
      if (assigneeId === triggeredByUserId) {
        return;
      }
      
      try {
        await createNotification({
          databases: adminDatabases,
          userId: assigneeId,
          type: dbNotificationType,
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
    console.log('[notifyWorkspaceAdmins] Starting notification process', {
      taskId: task.$id,
      triggeredByUserId,
      notificationType,
      workspaceId
    });

    // Use admin client to ensure we can create notifications for any user
    const { databases: adminDatabases } = await createAdminClient();

    // Get all workspace members
    const members = await adminDatabases.listDocuments(DATABASE_ID, MEMBERS_ID, [
      Query.equal("workspaceId", workspaceId),
      Query.equal("role", "ADMIN"),
    ]);

    console.log('[notifyWorkspaceAdmins] Found admin members:', members.documents.length);

    if (members.documents.length === 0) {
      console.log('[notifyWorkspaceAdmins] No admin members found');
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

    // Map notification types to supported database enum values
    const supportedTypes = ["task_assigned", "task_updated", "task_completed", "task_deleted", "task_comment"];
    const dbNotificationType = supportedTypes.includes(notificationType) ? notificationType : "task_updated";

    // Create notifications for admin members
    const notificationPromises = members.documents.map(async (member: Models.Document) => {
      // Don't notify the user who made the change
      if (member.userId === triggeredByUserId) {
        console.log('[notifyWorkspaceAdmins] Skipping notification for triggering user:', member.userId);
        return;
      }

      console.log('[notifyWorkspaceAdmins] Creating notification for admin:', member.userId);

      try {
        await createNotification({
          databases: adminDatabases,
          userId: member.userId,
          type: dbNotificationType,
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
        console.log('[notifyWorkspaceAdmins] Notification created successfully for:', member.userId);
      } catch (error) {
        console.error('[notifyWorkspaceAdmins] Failed to create notification:', error);
      }
    });

    await Promise.all(notificationPromises);
    console.log('[notifyWorkspaceAdmins] All notifications processed');
  } catch (error) {
    console.error('[notifyWorkspaceAdmins] Error in notification process:', error);
  }
}
