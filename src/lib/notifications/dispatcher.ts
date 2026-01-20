/**
 * Notification Dispatcher
 * 
 * Central notification routing service that:
 * 1. Resolves recipients for workitem events
 * 2. Checks user preferences
 * 3. Routes notifications to appropriate channels (socket, email)
 * 
 * Failures in one channel do not affect others (isolated execution).
 */

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, MEMBERS_ID, NOTIFICATIONS_ID } from "@/config";
import {
    WorkitemEvent,
    WorkitemEventType,
    NotificationPayload,
    UserNotificationPreferences,
    DEFAULT_NOTIFICATION_PREFERENCES,
    NotificationChannel,
    ChannelHandler,
} from "./types";
import { getNotificationTitle, getNotificationSummary, getDefaultChannelsForEvent } from "./events";

// =============================================================================
// DISPATCHER CLASS
// =============================================================================

class NotificationDispatcher {
    private channelHandlers: Map<NotificationChannel, ChannelHandler> = new Map();

    /**
     * Register a channel handler
     */
    registerChannel(handler: ChannelHandler): void {
        this.channelHandlers.set(handler.name, handler);
    }

    /**
     * Dispatch a workitem event to all relevant recipients via appropriate channels
     */
    async dispatch(event: WorkitemEvent): Promise<void> {
        try {
            // console.log("==========================================================");
            // console.log("[Dispatcher] NOTIFICATION DISPATCH STARTED");
            // console.log(`[Dispatcher] Event Type: ${event.type}`);
            // console.log(`[Dispatcher] Workitem ID: ${event.workitemId}`);
            // console.log(`[Dispatcher] Workspace ID: ${event.workspaceId}`);
            // console.log(`[Dispatcher] Triggered By: ${event.triggeredBy}`);
            // console.log(`[Dispatcher] Workitem AssigneeIds: ${JSON.stringify(event.workitem?.assigneeIds || [])}`);
            // console.log("==========================================================");

            // 1. Resolve recipients
            const recipientUserIds = await this.resolveRecipients(event);
            // console.log(`[Dispatcher] Resolved ${recipientUserIds.length} recipients: ${JSON.stringify(recipientUserIds)}`);

            if (recipientUserIds.length === 0) {
                // console.log("[Dispatcher] NO RECIPIENTS TO NOTIFY - SKIPPING");
                // console.log("[Dispatcher] This means assigneeIds could not be resolved to user IDs");
                return;
            }

            // 2. Process each recipient
            const deliveryPromises = recipientUserIds.map(async (userId) => {
                try {
                    await this.processRecipient(userId, event);
                } catch (error) {
                    console.error(`[Dispatcher] Failed to process recipient ${userId}:`, error);
                }
            });

            await Promise.allSettled(deliveryPromises);

            // console.log("==========================================================");
            // console.log(`[Dispatcher] NOTIFICATION DISPATCH COMPLETED for event: ${event.type}`);
            // console.log("==========================================================");
        } catch (error) {
            console.error("[Dispatcher] DISPATCH FAILED WITH ERROR:", error);
            // Don't throw - notifications should not break the main flow
        }
    }

    /**
     * Process a single recipient
     */
    private async processRecipient(userId: string, event: WorkitemEvent): Promise<void> {
        // Skip self-notifications
        if (userId === event.triggeredBy) {
            // console.log(`[Dispatcher] Skipping self-notification for user: ${userId}`);
            return;
        }

        // Get user preferences
        const preferences = await this.getUserPreferences(userId);

        // Check if workitem is muted
        if (preferences.mutedWorkitems.includes(event.workitemId)) {
            // console.log(`[Dispatcher] Workitem muted for user: ${userId}`);
            return;
        }

        // Check if project is muted
        if (event.workitem.projectId && preferences.mutedProjects.includes(event.workitem.projectId)) {
            // console.log(`[Dispatcher] Project muted for user: ${userId}`);
            return;
        }

        // Determine channels based on event type and user preferences
        const channels = this.determineChannels(event, preferences);

        if (channels.length === 0) {
            // console.log(`[Dispatcher] No channels enabled for user: ${userId}`);
            return;
        }

        // Build notification payload
        const payload = this.buildPayload(event);

        // Store in-app notification first (always)
        await this.storeInAppNotification(userId, event, payload);

        // Dispatch to each channel (parallel, isolated failures)
        const channelPromises = channels.map(async (channelName) => {
            const handler = this.channelHandlers.get(channelName);
            if (handler) {
                try {
                    await handler.send(userId, payload);
                    // console.log(`[Dispatcher] Sent via ${channelName} to user: ${userId}`);
                } catch (error) {
                    console.error(`[Dispatcher] ${channelName} delivery failed for user ${userId}:`, error);
                }
            }
        });

        await Promise.allSettled(channelPromises);
    }

    /**
     * Resolve all recipients for an event
     */
    private async resolveRecipients(event: WorkitemEvent): Promise<string[]> {
        const recipients = new Set<string>();
        const { databases } = await createAdminClient();

        // Get member documents for assignees to resolve user IDs
        const assigneeIds = event.workitem.assigneeIds || [];
        // console.log(`[Dispatcher:resolveRecipients] Looking up members for assigneeIds: ${JSON.stringify(assigneeIds)}`);

        if (assigneeIds.length > 0) {
            try {
                const members = await databases.listDocuments(
                    DATABASE_ID,
                    MEMBERS_ID,
                    [Query.equal("$id", assigneeIds)]
                );
                // console.log(`[Dispatcher:resolveRecipients] Found ${members.documents.length} member documents`);

                members.documents.forEach((member) => {
                    // console.log(`[Dispatcher:resolveRecipients] Member ${member.$id} -> userId: ${member.userId}`);
                    if (member.userId) {
                        recipients.add(member.userId as string);
                    }
                });
            } catch (error) {
                console.error("[Dispatcher] Failed to resolve assignee members:", error);
            }
        } else {
            // console.log("[Dispatcher:resolveRecipients] No assigneeIds in workitem");
        }

        // Add reporter for certain events
        if (
            [
                WorkitemEventType.WORKITEM_COMPLETED,
                WorkitemEventType.WORKITEM_OVERDUE,
                WorkitemEventType.WORKITEM_STATUS_CHANGED,
            ].includes(event.type)
        ) {
            if (event.workitem.reporterId) {
                recipients.add(event.workitem.reporterId);
            }
        }

        // Add mentioned users for comments
        if (
            event.type === WorkitemEventType.WORKITEM_COMMENT_ADDED &&
            event.metadata?.mentionedUserIds
        ) {
            (event.metadata.mentionedUserIds as string[]).forEach((id) => recipients.add(id));
        }

        return Array.from(recipients);
    }

    /**
     * Get user notification preferences
     */
    private async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
        try {
            const { users } = await createAdminClient();
            const user = await users.get(userId);

            const prefs = user.prefs as { notificationPrefs?: string } | undefined;

            if (prefs?.notificationPrefs) {
                try {
                    return {
                        ...DEFAULT_NOTIFICATION_PREFERENCES,
                        ...JSON.parse(prefs.notificationPrefs),
                    };
                } catch {
                    // Invalid JSON, use defaults
                }
            }
        } catch (error) {
            console.error(`[Dispatcher] Failed to get preferences for user ${userId}:`, error);
        }

        return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    /**
     * Determine which channels to use based on event type and user preferences
     */
    private determineChannels(
        event: WorkitemEvent,
        preferences: UserNotificationPreferences
    ): NotificationChannel[] {
        const defaultChannels = getDefaultChannelsForEvent(event);
        const channels: NotificationChannel[] = [];

        // Apply user preferences
        if (preferences.pushNotifications && defaultChannels.includes("socket")) {
            channels.push("socket");
        }

        if (preferences.emailNotifications && defaultChannels.includes("email")) {
            channels.push("email");
        }

        return channels;
    }

    /**
     * Build notification payload from event
     */
    private buildPayload(event: WorkitemEvent): NotificationPayload {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

        return {
            id: ID.unique(),
            type: event.type,
            workitemId: event.workitemId,
            workspaceId: event.workspaceId,
            title: getNotificationTitle(event),
            summary: getNotificationSummary(event),
            triggeredBy: event.triggeredBy,
            triggeredByName: event.triggeredByName,
            timestamp: new Date().toISOString(),
            deepLinkUrl: `${appUrl}/workspaces/${event.workspaceId}/tasks/${event.workitemId}`,
            metadata: event.metadata,
        };
    }

    /**
     * Store notification in database for in-app display
     */
    private async storeInAppNotification(
        userId: string,
        event: WorkitemEvent,
        payload: NotificationPayload
    ): Promise<void> {
        try {
            // console.log(`[Dispatcher:storeInAppNotification] Creating DB notification for user: ${userId}`);
            const { databases } = await createAdminClient();

            // Map event type to supported database notification types
            const supportedTypes = ["task_assigned", "task_updated", "task_completed", "task_deleted", "task_comment"];
            const dbType = this.mapEventTypeToDbType(event.type);
            const finalType = supportedTypes.includes(dbType) ? dbType : "task_updated";

            const notification = await databases.createDocument(
                DATABASE_ID,
                NOTIFICATIONS_ID,
                ID.unique(),
                {
                    userId,
                    type: finalType,
                    title: payload.title,
                    message: payload.summary,
                    taskId: event.workitemId,
                    workspaceId: event.workspaceId,
                    triggeredBy: event.triggeredBy,
                    metadata: JSON.stringify(payload.metadata || {}),
                    read: false,
                },
                [
                    `read("user:${userId}")`,
                    `update("user:${userId}")`,
                    `delete("user:${userId}")`,
                ]
            );
            // console.log(`[Dispatcher] DB NOTIFICATION CREATED: ${notification.$id}`);
            // console.log(`[Dispatcher] Title: "${payload.title}", Message: "${payload.summary}"`);
        } catch (error) {
            console.error(`[Dispatcher] FAILED to store in-app notification for user ${userId}:`, error);
        }
    }

    /**
     * Map WorkitemEventType to database-compatible notification type
     */
    private mapEventTypeToDbType(eventType: WorkitemEventType): string {
        switch (eventType) {
            case WorkitemEventType.WORKITEM_ASSIGNED:
                return "task_assigned";
            case WorkitemEventType.WORKITEM_COMPLETED:
                return "task_completed";
            case WorkitemEventType.WORKITEM_DELETED:
                return "task_deleted";
            case WorkitemEventType.WORKITEM_COMMENT_ADDED:
                return "task_comment";
            default:
                return "task_updated";
        }
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const dispatcher = new NotificationDispatcher();

// =============================================================================
// CONVENIENCE FUNCTION
// =============================================================================

/**
 * Dispatch a workitem event through the notification system
 */
export async function dispatchWorkitemEvent(event: WorkitemEvent): Promise<void> {
    return dispatcher.dispatch(event);
}
