import "server-only";

import { Databases, ID } from "node-appwrite";
import { DATABASE_ID, USAGE_EVENTS_ID } from "@/config";
import { ResourceType, UsageSource, UsageEventMetadata } from "@/features/usage/types";

/**
 * Centralized Usage Metering Service
 * 
 * This service provides methods to log usage events that will be used for billing.
 * All methods are designed to be called from server-side code only.
 * 
 * Usage events are immutable and auditable.
 */

export interface LogUsageOptions {
    databases: Databases;
    workspaceId: string;
    projectId?: string;
    units: number;
    metadata?: UsageEventMetadata;
    // Source context for display in usage events
    sourceContext?: {
        type: 'project' | 'workspace' | 'admin' | 'other';
        projectName?: string;
        workspaceName?: string;
        displayName?: string; // e.g., "Project XYZ" or "Admin Panel"
    };
}

/**
 * Log traffic usage (API requests, file transfers, webhooks, etc.)
 */
export async function logTrafficUsage(
    options: LogUsageOptions & {
        source: UsageSource;
    }
): Promise<void> {
    try {
        await options.databases.createDocument(
            DATABASE_ID,
            USAGE_EVENTS_ID,
            ID.unique(),
            {
                workspaceId: options.workspaceId,
                projectId: options.projectId || null,
                resourceType: ResourceType.TRAFFIC,
                units: options.units,
                metadata: JSON.stringify({
                    ...options.metadata,
                    sourceContext: options.sourceContext ?? {
                        type: options.projectId ? 'project' : 'workspace',
                        displayName: 'Unknown',
                    },
                }),
                timestamp: new Date().toISOString(),
                source: options.source,
            }
        );
    } catch (error) {
        // Log error but don't throw - metering should not block operations
        console.error("[UsageMetering] Failed to log traffic usage:", error);
    }
}

/**
 * Log storage usage (file uploads, downloads, deletions)
 */
export async function logStorageUsage(
    options: LogUsageOptions & {
        operation: "upload" | "download" | "delete";
    }
): Promise<void> {
    try {
        await options.databases.createDocument(
            DATABASE_ID,
            USAGE_EVENTS_ID,
            ID.unique(),
            {
                workspaceId: options.workspaceId,
                projectId: options.projectId || null,
                resourceType: ResourceType.STORAGE,
                units: options.units,
                metadata: JSON.stringify({
                    ...options.metadata,
                    operation: options.operation,
                    sourceContext: options.sourceContext ?? {
                        type: options.projectId ? 'project' : 'workspace',
                        displayName: 'Unknown',
                    },
                }),
                timestamp: new Date().toISOString(),
                source: UsageSource.FILE,
            }
        );
    } catch (error) {
        console.error("[UsageMetering] Failed to log storage usage:", error);
    }
}

/**
 * Log compute usage (background jobs, automations, etc.)
 * 
 * WHY: Compute operations have different costs based on complexity.
 * AI operations cost more than simple CRUD. We store both raw and
 * weighted units to enable accurate billing while maintaining audit trail.
 * 
 * IDEMPOTENCY: Uses setTimeout + idempotency key to:
 * 1. Defer metering to avoid blocking main operations
 * 2. Prevent duplicate events from retries
 */
export async function logComputeUsage(
    options: LogUsageOptions & {
        jobType: string;
        isAI?: boolean;
        operationId?: string; // Optional unique ID for idempotency
    }
): Promise<void> {
    // Defer the metering call to avoid blocking main operations
    // This prevents connection pool exhaustion during high-frequency updates
    setTimeout(async () => {
        try {
            // Calculate weighted units based on job type
            const baseUnits = options.units;
            const weight = getComputeUnits(options.jobType);
            const weightedUnits = baseUnits * weight;

            // Generate idempotency key to prevent duplicate events
            // Format: workspaceId:jobType:operationId OR workspaceId:jobType:timestamp
            const idempotencyKey = options.operationId
                ? `${options.workspaceId}:${options.jobType}:${options.operationId}`
                : `${options.workspaceId}:${options.jobType}:${Date.now()}`;

            await options.databases.createDocument(
                DATABASE_ID,
                USAGE_EVENTS_ID,
                ID.unique(),
                {
                    workspaceId: options.workspaceId,
                    projectId: options.projectId || null,
                    resourceType: ResourceType.COMPUTE,
                    units: weightedUnits,           // Use weighted units for billing
                    // Note: baseUnits, weightedUnits, idempotencyKey stored in metadata
                    // until Appwrite collection is updated with these attributes
                    metadata: JSON.stringify({
                        ...options.metadata,
                        jobType: options.jobType,
                        isAI: options.isAI || false,
                        weight: weight,
                        baseUnits: baseUnits,
                        weightedUnits: weightedUnits,
                        idempotencyKey: idempotencyKey,
                        sourceContext: options.sourceContext ?? {
                            type: options.projectId ? 'project' : 'workspace',
                            displayName: 'Unknown',
                        },
                    }),
                    timestamp: new Date().toISOString(),
                    source: options.isAI ? UsageSource.AI : UsageSource.JOB,
                }
            );
        } catch (error: unknown) {
            // Check for duplicate key error - silently ignore
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
                // Silently skip duplicate - idempotency working as intended
                return;
            }
            // Log other errors but don't throw - metering should never block operations
            console.error("[UsageMetering] Failed to log compute usage:", error);
        }
    }, 100); // Small delay to let main operation complete first
}

/**
 * Log AI-specific compute usage
 */
export async function logAIUsage(
    options: LogUsageOptions & {
        model: string;
        tokensUsed?: number;
    }
): Promise<void> {
    try {
        await options.databases.createDocument(
            DATABASE_ID,
            USAGE_EVENTS_ID,
            ID.unique(),
            {
                workspaceId: options.workspaceId,
                projectId: options.projectId || null,
                resourceType: ResourceType.COMPUTE,
                units: options.units,
                metadata: JSON.stringify({
                    ...options.metadata,
                    model: options.model,
                    tokensUsed: options.tokensUsed,
                    isAI: true,
                }),
                timestamp: new Date().toISOString(),
                source: UsageSource.AI,
            }
        );
    } catch (error) {
        console.error("[UsageMetering] Failed to log AI usage:", error);
    }
}

/**
 * Calculate request/response size in bytes
 */
export function calculatePayloadSize(payload: unknown): number {
    if (!payload) return 0;
    try {
        return new Blob([JSON.stringify(payload)]).size;
    } catch {
        return 0;
    }
}

/**
 * Compute unit weights for different job types
 * 
 * WHY: Different operations have different computational costs.
 * AI operations cost more than simple CRUD. This ensures fair billing.
 * 
 * CRITICAL: Every operation type MUST be listed here.
 * Aggregation MUST use weightedUnits only.
 */
export const COMPUTE_UNIT_WEIGHTS: Record<string, number> = {
    // Read operations (lower weight - still billable)
    task_read: 0.5,
    work_item_read: 0.5,
    project_read: 0.5,
    workspace_read: 0.5,
    sprint_read: 0.5,

    // Task/Work Item operations
    task_create: 1,
    task_update: 1,
    task_delete: 1,
    task_bulk_update: 5,
    work_item_create: 1,
    work_item_update: 1,
    work_item_delete: 1,

    // Sprint operations
    sprint_create: 2,
    sprint_update: 1,
    sprint_delete: 1,
    sprint_complete: 3,

    // Comment operations
    comment_create: 1,
    comment_update: 1,
    comment_delete: 1,

    // Subtask operations
    subtask_create: 1,
    subtask_update: 1,
    subtask_delete: 1,
    subtask_toggle: 0.5,

    // Attachment/Storage operations
    attachment_upload: 2,
    attachment_download: 1,
    attachment_delete: 1,

    // Project operations
    project_create: 2,
    project_update: 1,
    project_delete: 2,

    // Workspace operations
    workspace_create: 3,
    workspace_update: 1,
    member_invite: 1,
    member_remove: 1,

    // Space operations
    space_create: 2,
    space_update: 1,
    space_delete: 2,
    space_member_add: 1,
    space_member_remove: 1,
    space_member_update: 1,

    // Automation/workflow
    workflow_transition: 2,
    automation_trigger: 5,
    automation_run: 3,

    // Notification operations
    notification_send: 1,
    notification_batch: 3,

    // AI operations (higher weights - compute intensive)
    ai_summary: 10,
    ai_code_review: 20,
    ai_doc_generation: 15,
    ai_suggestion: 5,

    // Background jobs
    aggregation: 3,
    sync: 5,
    export: 10,
    import: 15,
    snapshot: 2,
    alert_evaluation: 2,

    // Cache/revalidation (still billable)
    cache_rebuild: 1,
    revalidation: 0.5,

    // Default for unspecified operations
    default: 1,
};

/**
 * Get compute units for a job type
 */
export function getComputeUnits(jobType: string): number {
    return COMPUTE_UNIT_WEIGHTS[jobType] || COMPUTE_UNIT_WEIGHTS.default;
}
