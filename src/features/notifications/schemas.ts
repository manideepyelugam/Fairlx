import { z } from "zod";
import { NotificationType } from "./types";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  type: z.nativeEnum(NotificationType),
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(1000),
  taskId: z.string().trim().min(1, "Task ID is required"),
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  triggeredBy: z.string().trim().min(1, "Triggered by is required"),
  metadata: z.record(z.any()).optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().trim().min(1, "Notification ID is required"),
});

export const markAllNotificationsReadSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
});

export const getNotificationsSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace ID is required"),
  limit: z.coerce.number().min(1).max(100).default(50),
  unreadOnly: z.coerce.boolean().default(false),
});

export const deleteNotificationSchema = z.object({
  notificationId: z.string().trim().min(1, "Notification ID is required"),
});
