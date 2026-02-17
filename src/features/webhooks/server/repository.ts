import { Databases, ID, Query, Models } from "node-appwrite";
import { DATABASE_ID, PROJECT_WEBHOOKS_ID, PROJECT_WEBHOOK_DELIVERIES_ID } from "@/config";
import { Webhook, WebhookDelivery, WebhookDeliveryStatus, WebhookEventType } from "./types";

export class WebhookRepository {
    constructor(private databases: Databases) { }

    getDatabases(): Databases {
        return this.databases;
    }

    async createWebhook(data: {
        projectId: string;
        createdByUserId: string;
        name: string;
        url: string;
        secret?: string | null;
        events: WebhookEventType[];
        enabled?: boolean;
    }): Promise<Webhook> {
        return await this.databases.createDocument<Webhook>(
            DATABASE_ID,
            PROJECT_WEBHOOKS_ID,
            ID.unique(),
            {
                ...data,
                enabled: data.enabled ?? true,
            }
        );
    }

    async getWebhooksByProject(projectId: string): Promise<Webhook[]> {
        const result = await this.databases.listDocuments<Webhook>(
            DATABASE_ID,
            PROJECT_WEBHOOKS_ID,
            [Query.equal("projectId", projectId), Query.orderDesc("$createdAt")]
        );
        return result.documents;
    }

    async getEnabledWebhooksByProject(projectId: string): Promise<Webhook[]> {
        const result = await this.databases.listDocuments<Webhook>(
            DATABASE_ID,
            PROJECT_WEBHOOKS_ID,
            [
                Query.equal("projectId", projectId),
                Query.equal("enabled", true)
            ]
        );
        return result.documents;
    }

    async updateWebhook(webhookId: string, data: Partial<Omit<Webhook, keyof Models.Document>>): Promise<Webhook> {
        return await this.databases.updateDocument<Webhook>(
            DATABASE_ID,
            PROJECT_WEBHOOKS_ID,
            webhookId,
            data
        );
    }

    async deleteWebhook(webhookId: string): Promise<void> {
        await this.databases.deleteDocument(DATABASE_ID, PROJECT_WEBHOOKS_ID, webhookId);
    }

    async logDelivery(data: {
        webhookId: string;
        eventType: WebhookEventType;
        payload: string;
        status: WebhookDeliveryStatus;
        responseCode?: number | null;
        responseBody?: string | null;
        attempts?: number;
    }): Promise<WebhookDelivery> {
        const delivery = await this.databases.createDocument<WebhookDelivery>(
            DATABASE_ID,
            PROJECT_WEBHOOK_DELIVERIES_ID,
            ID.unique(),
            {
                ...data,
                attempts: data.attempts ?? 1,
            }
        );

        // Update last triggered at on the webhook
        await this.updateWebhook(data.webhookId, {
            lastTriggeredAt: new Date().toISOString(),
        });

        return delivery;
    }

    async getRecentDeliveries(webhookId: string, limit = 10): Promise<WebhookDelivery[]> {
        const result = await this.databases.listDocuments<WebhookDelivery>(
            DATABASE_ID,
            PROJECT_WEBHOOK_DELIVERIES_ID,
            [
                Query.equal("webhookId", webhookId),
                Query.orderDesc("$createdAt"),
                Query.limit(limit)
            ]
        );
        return result.documents;
    }
}
