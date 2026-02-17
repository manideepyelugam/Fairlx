import crypto from "crypto";
import { createAdminClient } from "@/lib/appwrite";
import { WebhookRepository } from "./repository";
import { RetryQueue } from "./retryQueue";
import { Webhook, WebhookDeliveryStatus, WebhookEventType, WebhookPayload } from "./types";
import { DATABASE_ID, PROJECTS_ID } from "@/config";
import { Project } from "@/features/projects/types";

export class WebhookDispatcher {
    private repository: WebhookRepository | null = null;
    private retryQueue: RetryQueue;

    constructor() {
        this.retryQueue = new RetryQueue(
            (task) => this.retryDelivery(task),
            (task) => this.markPermanentlyFailed(task)
        );
    }

    private async getRepository(): Promise<WebhookRepository> {
        if (!this.repository) {
            const { databases } = await createAdminClient();
            this.repository = new WebhookRepository(databases);
        }
        return this.repository;
    }

    /**
     * Dispatch an event to all matching webhooks
     */
    async dispatch(
        projectId: string,
        event: WebhookEventType,
        payload: Omit<WebhookPayload, "event" | "projectId" | "timestamp" | "project" | "embeds">
    ): Promise<void> {
        // console.log(`[WebhookDispatcher] Dispatching event: ${event} for project: ${projectId}`);
        try {
            const repo = await this.getRepository();
            const webhooks = await repo.getEnabledWebhooksByProject(projectId);

            if (webhooks.length === 0) return;

            // Fetch project details for richer payload
            const { databases } = await createAdminClient();
            const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

            const matchingWebhooks = webhooks.filter((w) => w.events.includes(event));
            if (matchingWebhooks.length === 0) return;

            const projectInfo = {
                id: projectId,
                name: project.name,
                imageUrl: project.imageUrl,
            };

            const eventLabel = event.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            const content = `[${project.name}] ${eventLabel}: ${payload.data.title || payload.data.summary || "Project Event"}`;

            // Build rich embeds for Discord/Slack
            const color = this.getEventColor(event);
            const embeds = [{
                title: `${eventLabel}: ${payload.data.title || "Project Event"}`,
                description: payload.data.summary || "",
                url: payload.data.deepLinkUrl,
                color: color,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Fairlx Webhooks • ${project.name}`,
                    icon_url: "https://fairlx.com/logo.png" // Fallback logo
                },
                author: {
                    name: payload.actor.userName,
                    icon_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.actor.userName)}&background=random`
                },
                thumbnail: project.imageUrl?.startsWith("http") ? {
                    url: project.imageUrl
                } : undefined,
                fields: [
                    { name: "Project", value: project.name, inline: true },
                    { name: "ID", value: `\`${payload.data.workitemKey || payload.data.workitemId || "N/A"}\``, inline: true },
                    { name: "Event", value: eventLabel, inline: true }
                ]
            }];

            const fullPayload: WebhookPayload = {
                ...payload,
                event,
                projectId,
                timestamp: new Date().toISOString(),
                content,
                description: payload.data.summary || "",
                project: projectInfo,
                embeds,
            };

            const dispatchPromises = matchingWebhooks.map((webhook) =>
                this.deliver(webhook, fullPayload)
            );

            await Promise.allSettled(dispatchPromises);
        } catch (error) {
            console.error("[WebhookDispatcher] Dispatch failed:", error);
        }
    }

    private getEventColor(event: WebhookEventType): number {
        switch (event) {
            case WebhookEventType.TASK_CREATED: return 0x22c55e; // Green
            case WebhookEventType.TASK_COMPLETED: return 0x10b981; // Emerald
            case WebhookEventType.TASK_DELETED: return 0xef4444; // Red
            case WebhookEventType.TASK_ASSIGNED: return 0x0ea5e9; // Sky
            case WebhookEventType.TASK_UNASSIGNED: return 0x64748b; // Slate
            case WebhookEventType.STATUS_CHANGED: return 0xf59e0b; // Amber
            case WebhookEventType.PRIORITY_CHANGED: return 0xf97316; // Orange
            case WebhookEventType.DUE_DATE_CHANGED: return 0xa855f7; // Purple
            case WebhookEventType.COMMENT_ADDED: return 0x3b82f6; // Blue
            case WebhookEventType.REPLY_ADDED: return 0x6366f1; // Indigo
            case WebhookEventType.WORKITEM_MENTIONED: return 0x8b5cf6; // Violet
            case WebhookEventType.ATTACHMENT_ADDED: return 0x14b8a6; // Teal
            case WebhookEventType.ATTACHMENT_DELETED: return 0xf43f5e; // Rose
            case WebhookEventType.MEMBER_ADDED: return 0xec4899; // Pink
            case WebhookEventType.MEMBER_REMOVED: return 0x9f1239; // Rose Dark
            case WebhookEventType.PROJECT_UPDATED: return 0x06b6d4; // Cyan
            default: return 0x64748b; // Slate
        }
    }

    /**
     * Manual test trigger
     */
    async test(webhook: Webhook): Promise<boolean> {
        // console.log(`[WebhookDispatcher] Manual test for webhook: ${webhook.name} (${webhook.url})`);

        // Fetch project for test data
        const { databases } = await createAdminClient();
        const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, webhook.projectId);

        const dummyPayload: WebhookPayload = {
            event: WebhookEventType.TASK_CREATED,
            projectId: webhook.projectId,
            timestamp: new Date().toISOString(),
            content: `[${project.name}] TEST EVENT: Manual dispatch from settings.`,
            description: "If you received this, your webhook configuration is working correctly!",
            project: {
                id: project.$id,
                name: project.name,
                imageUrl: project.imageUrl,
            },
            actor: {
                userId: webhook.createdByUserId,
                userName: "Fairlx System",
                userEmail: "system@fairlx.com",
            },
            data: {
                workitemId: "TEST-123",
                title: "Manual Test Task",
                summary: "This is a dummy event triggered manually to verify connectivity and presentation.",
                deepLinkUrl: "https://fairlx.com",
            },
            embeds: [{
                title: "Webhook Test Success!",
                description: "Connectivity verified. Your project events will now appear here.",
                color: 0x22c55e,
                author: {
                    name: "Fairlx System",
                    icon_url: `https://ui-avatars.com/api/?name=Fairlx+System&background=random`
                },
                thumbnail: project.imageUrl?.startsWith("http") ? {
                    url: project.imageUrl
                } : undefined,
                fields: [
                    { name: "Project", value: project.name, inline: true },
                    { name: "Status", value: "Functional", inline: true }
                ],
                footer: { text: "Fairlx Webhooks • " + project.name }
            }]
        };

        return await this.deliver(webhook, dummyPayload);
    }

    /**
     * Deliver payload to a specific webhook
     */
    private async deliver(webhook: Webhook, payload: WebhookPayload, attempt = 1): Promise<boolean> {
        // console.log(`[WebhookDispatcher] Delivering to ${webhook.url} (Attempt ${attempt})`);
        const payloadString = JSON.stringify(payload);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Fairlx-Event": payload.event,
            "X-Fairlx-Delivery": crypto.randomUUID(),
        };

        if (webhook.secret) {
            const signature = crypto
                .createHmac("sha256", webhook.secret)
                .update(payloadString)
                .digest("hex");
            headers["X-Fairlx-Signature"] = signature;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(webhook.url, {
                method: "POST",
                headers,
                body: payloadString,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const responseBody = await response.text();
            const status = response.ok ? WebhookDeliveryStatus.SUCCESS : WebhookDeliveryStatus.FAILED;

            // console.log(`[WebhookDispatcher] Result for ${webhook.url}: ${response.status} ${response.statusText}`);

            const repo = await this.getRepository();
            await repo.logDelivery({
                webhookId: webhook.$id,
                eventType: payload.event,
                payload: payloadString,
                status,
                responseCode: response.status,
                responseBody: responseBody.substring(0, 1000), // Cap body size
                attempts: attempt,
            });

            if (!response.ok && this.shouldRetry(response.status)) {
                if (attempt === 1) {
                    await this.retryQueue.add({
                        webhookId: webhook.$id,
                        eventType: payload.event,
                        payload: payloadString,
                    });
                }
                return false;
            }

            return response.ok;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error(`[WebhookDispatcher] Delivery to ${webhook.url} error:`, errorMessage);

            const repo = await this.getRepository();
            await repo.logDelivery({
                webhookId: webhook.$id,
                eventType: payload.event,
                payload: payloadString,
                status: WebhookDeliveryStatus.FAILED,
                responseBody: errorMessage,
                attempts: attempt,
            });

            if (attempt === 1) {
                await this.retryQueue.add({
                    webhookId: webhook.$id,
                    eventType: payload.event,
                    payload: payloadString,
                });
            }

            return false;
        }
    }

    private shouldRetry(statusCode: number): boolean {
        // Retry on 5xx or specific network-like errors
        return statusCode >= 500;
    }

    private async retryDelivery(task: { webhookId: string; eventType: string; payload: string; attempts: number }): Promise<boolean> {
        const repo = await this.getRepository();
        try {
            const webhook = await (await repo.getDatabases()).getDocument<Webhook>(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_PROJECT_WEBHOOKS_ID!,
                task.webhookId
            );

            if (!webhook.enabled) return true; // Stop retrying if disabled

            return await this.deliver(webhook, JSON.parse(task.payload), task.attempts);
        } catch {
            return false;
        }
    }

    private async markPermanentlyFailed(task: { webhookId: string; eventType: string; payload: string; attempts: number }): Promise<void> {
        // Already logged in deliver method's final attempt
        console.warn(`[WebhookDispatcher] Webhook ${task.webhookId} permanently failed after ${task.attempts} attempts.`);
    }
}

export const webhookDispatcher = new WebhookDispatcher();
