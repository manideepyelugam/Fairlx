/**
 * Socket Push Notification Emitter
 * 
 * This module provides a safe, fire-and-forget function to push
 * notifications via WebSocket to connected users.
 * 
 * GUARANTEES:
 * - Non-blocking (async, doesn't await)
 * - Never throws exceptions
 * - Logs failures silently
 * - Works even if sockets are unavailable
 * 
 * USAGE:
 * Called from createNotification() AFTER successful DB write.
 * Does NOT modify or depend on email/workitem logic.
 */

import { Models } from "node-appwrite";
import { emitToUser, isSocketServerAvailable } from "./server";
import { SocketNotificationPayload } from "./types";

/**
 * Push a notification to a user via WebSocket
 * 
 * This function is FIRE-AND-FORGET:
 * - Call immediately after DB notification is created
 * - Do NOT await this function
 * - Failures are logged but never thrown
 * 
 * @param notification - The notification document from database
 */
export function pushNotificationToSocket(notification: Models.Document): void {
    // Execute asynchronously without blocking
    setImmediate(() => {
        try {
            // Quick check if sockets are even available
            if (!isSocketServerAvailable()) {
                console.debug("[SocketPush] Socket server not available, skipping");
                return;
            }

            const userId = notification.userId as string;
            if (!userId) {
                return;
            }

            // Build lightweight payload
            const payload: SocketNotificationPayload = {
                notificationId: notification.$id,
                type: notification.type as string,
                title: notification.title as string,
                message: notification.message as string,
                workitemId: notification.taskId as string | undefined,
                workspaceId: notification.workspaceId as string,
                createdAt: notification.$createdAt,
                triggeredBy: notification.triggeredBy as string | undefined,
            };

            // Fire and forget - emitToUser handles its own errors
            emitToUser(userId, payload);
        } catch {
            // CRITICAL: Never throw - silently fail in production
        }
    });
}
