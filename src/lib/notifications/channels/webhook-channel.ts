import { ChannelHandler, NotificationPayload, NotificationChannel } from "../types";
import { webhookDispatcher } from "@/features/webhooks/server/webhookDispatcher";
import { WebhookEventType } from "@/features/webhooks/server/types";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, PROJECTS_ID } from "@/config";
import { Query } from "node-appwrite";

export class WebhookChannelHandler implements ChannelHandler {
    readonly name: NotificationChannel = "webhook";
    readonly isProjectLevel = true;

    async send(_userId: string, payload: NotificationPayload): Promise<void> {
        // userId is not directly used for webhooks as they are project-wide,
        // but it's passed here as the "actor" info.

        if (!payload.projectId) {
            // Handle Workspace-level broadcast (e.g., MEMBER_ADDED)
            if (payload.workspaceId) {
                await this.broadcastToWorkspace(payload);
                return;
            }
            console.log("[WebhookChannel] No projectId or workspaceId in payload, skipping");
            return;
        }

        await this.dispatchToProject(payload.projectId, payload);
    }

    /**
     * Dispatch event to a specific project's webhooks
     */
    private async dispatchToProject(projectId: string, payload: NotificationPayload): Promise<void> {
        // Map WorkitemEventType to WebhookEventType
        const eventType = this.mapToWebhookEvent(payload.type);
        if (!eventType) {
            console.log(`[WebhookChannel] Event type ${payload.type} not mapped to webhook event, skipping`);
            return;
        }

        console.log(`[WebhookChannel] Sending event ${eventType} for project ${projectId}`);

        await webhookDispatcher.dispatch(
            projectId,
            eventType,
            {
                actor: {
                    userId: payload.triggeredBy,
                    userName: payload.triggeredByName,
                    userEmail: "", // We could fetch this if needed
                },
                data: {
                    workitemId: payload.workitemId,
                    workitemKey: payload.workitemKey,
                    title: payload.title,
                    summary: payload.summary,
                    deepLinkUrl: payload.deepLinkUrl,
                    ...payload.metadata,
                }
            }
        );
    }

    /**
     * Broadcast a workspace-level event to all projects in that workspace
     */
    private async broadcastToWorkspace(payload: NotificationPayload): Promise<void> {
        try {
            const { databases } = await createAdminClient();
            const projects = await databases.listDocuments(
                DATABASE_ID,
                PROJECTS_ID,
                [Query.equal("workspaceId", payload.workspaceId)]
            );

            console.log(`[WebhookChannel] Broadcasting ${payload.type} to ${projects.total} projects in workspace ${payload.workspaceId}`);

            const broadcastPromises = projects.documents.map(project =>
                this.dispatchToProject(project.$id, payload).catch(err => {
                    console.error(`[WebhookChannel] Failed to dispatch to project ${project.$id}:`, err);
                })
            );

            await Promise.allSettled(broadcastPromises);
        } catch (error) {
            console.error("[WebhookChannel] Workspace broadcast failed:", error);
        }
    }

    private mapToWebhookEvent(type: string): WebhookEventType | null {
        switch (type) {
            case "WORKITEM_CREATED": return WebhookEventType.TASK_CREATED;
            case "WORKITEM_UPDATED": return WebhookEventType.TASK_UPDATED;
            case "WORKITEM_COMPLETED": return WebhookEventType.TASK_COMPLETED;
            case "WORKITEM_COMMENT_ADDED": return WebhookEventType.COMMENT_ADDED;
            case "WORKITEM_MENTION": return WebhookEventType.WORKITEM_MENTIONED;
            case "WORKITEM_STATUS_CHANGED": return WebhookEventType.STATUS_CHANGED;
            case "WORKITEM_ASSIGNED": return WebhookEventType.TASK_ASSIGNED;
            case "WORKITEM_UNASSIGNED": return WebhookEventType.TASK_UNASSIGNED;
            case "WORKITEM_PRIORITY_CHANGED": return WebhookEventType.PRIORITY_CHANGED;
            case "WORKITEM_DUE_DATE_CHANGED": return WebhookEventType.DUE_DATE_CHANGED;
            case "WORKITEM_ATTACHMENT_ADDED": return WebhookEventType.ATTACHMENT_ADDED;
            case "WORKITEM_ATTACHMENT_DELETED": return WebhookEventType.ATTACHMENT_DELETED;
            case "WORKITEM_DELETED": return WebhookEventType.TASK_DELETED;
            case "WORKSPACE_MEMBER_ADDED": return WebhookEventType.MEMBER_ADDED;
            case "WORKSPACE_MEMBER_REMOVED": return WebhookEventType.MEMBER_REMOVED;
            case "PROJECT_MEMBER_ADDED": return WebhookEventType.MEMBER_ADDED;
            case "PROJECT_MEMBER_REMOVED": return WebhookEventType.MEMBER_REMOVED;
            case "WORKITEM_REPLY": return WebhookEventType.REPLY_ADDED;
            case "PROJECT_UPDATED": return WebhookEventType.PROJECT_UPDATED;
            // Add more mappings as needed
            default: return null;
        }
    }
}

export const webhookChannelHandler = new WebhookChannelHandler();
