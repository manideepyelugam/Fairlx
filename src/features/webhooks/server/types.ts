import { Models } from "node-appwrite";

export enum WebhookEventType {
    TASK_CREATED = "TASK_CREATED",
    TASK_UPDATED = "TASK_UPDATED",
    TASK_COMPLETED = "TASK_COMPLETED",
    TASK_DELETED = "TASK_DELETED",
    TASK_ASSIGNED = "TASK_ASSIGNED",
    TASK_UNASSIGNED = "TASK_UNASSIGNED",
    STATUS_CHANGED = "STATUS_CHANGED",
    PRIORITY_CHANGED = "PRIORITY_CHANGED",
    DUE_DATE_CHANGED = "DUE_DATE_CHANGED",
    COMMENT_ADDED = "COMMENT_ADDED",
    REPLY_ADDED = "REPLY_ADDED",
    WORKITEM_MENTIONED = "WORKITEM_MENTIONED",
    ATTACHMENT_ADDED = "ATTACHMENT_ADDED",
    ATTACHMENT_DELETED = "ATTACHMENT_DELETED",
    MEMBER_ADDED = "MEMBER_ADDED",
    MEMBER_REMOVED = "MEMBER_REMOVED",
    PROJECT_UPDATED = "PROJECT_UPDATED",
}

export interface Webhook extends Models.Document {
    projectId: string;
    createdByUserId: string;
    name: string;
    url: string;
    secret?: string | null;
    enabled: boolean;
    events: WebhookEventType[];
    lastTriggeredAt?: string | null;
}

export enum WebhookDeliveryStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
}

export interface WebhookDelivery extends Models.Document {
    webhookId: string;
    eventType: WebhookEventType;
    payload: string;
    status: WebhookDeliveryStatus;
    responseCode?: number | null;
    responseBody?: string | null;
    attempts: number;
}

export interface WebhookWorkItemData {
    workitemId: string;
    workitemKey?: string;
    title?: string;
    summary?: string;
    deepLinkUrl?: string;
    [key: string]: unknown;
}

export interface WebhookPayload {
    event: WebhookEventType;
    projectId: string;
    timestamp: string;
    content?: string;
    description?: string;
    project: {
        id: string;
        name: string;
        imageUrl: string;
    };
    actor: {
        userId: string;
        userName: string;
        userEmail: string;
    };
    data: WebhookWorkItemData;
    embeds?: unknown[];
}
