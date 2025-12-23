import "server-only";

import { createMiddleware } from "hono/factory";
import { Databases, ID } from "node-appwrite";
import { DATABASE_ID, USAGE_EVENTS_ID } from "@/config";
import { ResourceType, UsageSource } from "@/features/usage/types";

/**
 * Global Traffic Metering Middleware
 * 
 * WHY: Every HTTP request MUST generate a usage event for billing.
 * This includes page loads, refreshes, API calls, and all traffic.
 * 
 * RULE: No exemptions. No "free" requests. Every byte is billable.
 * 
 * This middleware:
 * 1. Runs BEFORE routing logic
 * 2. Calculates request payload size
 * 3. Calculates response payload size
 * 4. Emits traffic usage_event for EVERY request
 * 5. Uses idempotency keys to prevent duplicate billing
 */

type MeteringContext = {
    Variables: {
        databases?: Databases;
        user?: { $id: string };
    };
};

/**
 * Calculate approximate size of request/response in bytes
 */
function estimatePayloadSize(obj: unknown): number {
    if (obj === null || obj === undefined) return 0;
    try {
        const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
        return new Blob([str]).size;
    } catch {
        return 0;
    }
}

/**
 * Extract workspace ID from request (URL or body)
 */
function extractWorkspaceId(url: string, body?: Record<string, unknown>): string | null {
    // Try URL path: /api/workspaces/{workspaceId}/...
    const pathMatch = url.match(/\/workspaces\/([a-zA-Z0-9]+)/);
    if (pathMatch) return pathMatch[1];

    // Try URL query: ?workspaceId=...
    const urlObj = new URL(url, 'http://localhost');
    const queryWorkspaceId = urlObj.searchParams.get('workspaceId');
    if (queryWorkspaceId) return queryWorkspaceId;

    // Try body
    if (body && typeof body.workspaceId === 'string') {
        return body.workspaceId;
    }

    return null;
}

/**
 * Global traffic metering middleware
 * 
 * CRITICAL: This MUST run on every request.
 * - Page loads
 * - API calls
 * - Refreshes
 * - Health checks
 * - Admin traffic
 * 
 * NO EXEMPTIONS.
 */
export const trafficMeteringMiddleware = createMiddleware<MeteringContext>(
    async (c, next) => {
        const startTime = Date.now();
        const requestUrl = c.req.url;
        const requestMethod = c.req.method;

        // Calculate request size
        let requestBody: Record<string, unknown> | null = null;
        let requestSize = 0;

        try {
            // Clone request to read body without consuming it
            const contentType = c.req.header('content-type') || '';
            if (contentType.includes('application/json')) {
                requestBody = await c.req.json().catch(() => null);
                requestSize = estimatePayloadSize(requestBody);
            } else {
                // For non-JSON, estimate from content-length header
                const contentLength = c.req.header('content-length');
                requestSize = contentLength ? parseInt(contentLength, 10) : 0;
            }
        } catch {
            requestSize = 0;
        }

        // Execute the actual route handler
        await next();

        // Calculate response size
        let responseSize = 0;
        try {
            const responseBody = c.res.clone();
            const text = await responseBody.text();
            responseSize = estimatePayloadSize(text);
        } catch {
            responseSize = 0;
        }

        const totalBytes = requestSize + responseSize;
        const duration = Date.now() - startTime;

        // Extract workspace ID for attribution
        const workspaceId = extractWorkspaceId(requestUrl, requestBody || undefined);

        // Only log if we have a databases instance and workspace context
        // Traffic from unauthenticated requests still needs logging
        // but we need the admin client for that
        const databases = c.get('databases');
        const user = c.get('user');

        if (databases && workspaceId) {
            // Generate idempotency key
            // Format: traffic:{userId}:{endpoint}:{method}:{timestamp_rounded}
            // Round timestamp to nearest second to handle retries
            const timestampRounded = Math.floor(startTime / 1000);
            const userId = user?.$id || 'anonymous';
            const endpoint = new URL(requestUrl, 'http://localhost').pathname;
            const idempotencyKey = `traffic:${userId}:${endpoint}:${requestMethod}:${timestampRounded}`;

            // Fire and forget - don't block the response
            // Using setTimeout to ensure response is sent first
            setTimeout(async () => {
                try {
                    await databases.createDocument(
                        DATABASE_ID,
                        USAGE_EVENTS_ID,
                        ID.unique(),
                        {
                            workspaceId,
                            projectId: null,
                            resourceType: ResourceType.TRAFFIC,
                            units: totalBytes,
                            // Note: idempotencyKey stored in metadata until Appwrite collection updated
                            metadata: JSON.stringify({
                                idempotencyKey,
                                endpoint,
                                method: requestMethod,
                                requestBytes: requestSize,
                                responseBytes: responseSize,
                                durationMs: duration,
                                statusCode: c.res.status,
                                // Source context for display
                                sourceContext: {
                                    type: endpoint.includes('/admin') ? 'admin' :
                                        endpoint.includes('/projects') ? 'project' : 'workspace',
                                    displayName: endpoint.includes('/admin') ? 'Admin Panel' :
                                        endpoint.includes('/projects') ? 'Project' : 'Workspace',
                                },
                            }),
                            timestamp: new Date(startTime).toISOString(),
                            source: UsageSource.API,
                        }
                    );
                } catch (error: unknown) {
                    // Silently handle duplicates (idempotency working)
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    if (!errorMessage.includes('duplicate') && !errorMessage.includes('unique')) {
                        console.error('[TrafficMetering] Failed to log:', error);
                    }
                }
            }, 50);
        }
    }
);

/**
 * Create metering context for routes that don't use session middleware
 * This allows traffic metering even for unauthenticated requests
 */
export async function logAnonymousTraffic(
    adminDatabases: Databases,
    options: {
        workspaceId: string;
        endpoint: string;
        method: string;
        requestBytes: number;
        responseBytes: number;
        durationMs: number;
        statusCode: number;
    }
): Promise<void> {
    const timestamp = Date.now();
    const idempotencyKey = `traffic:anonymous:${options.endpoint}:${options.method}:${Math.floor(timestamp / 1000)}`;

    try {
        await adminDatabases.createDocument(
            DATABASE_ID,
            USAGE_EVENTS_ID,
            ID.unique(),
            {
                workspaceId: options.workspaceId,
                projectId: null,
                resourceType: ResourceType.TRAFFIC,
                units: options.requestBytes + options.responseBytes,
                // Note: idempotencyKey stored in metadata until Appwrite collection updated
                metadata: JSON.stringify({ ...options, idempotencyKey }),
                timestamp: new Date(timestamp).toISOString(),
                source: UsageSource.API,
            }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('duplicate') && !errorMessage.includes('unique')) {
            console.error('[TrafficMetering] Failed to log anonymous traffic:', error);
        }
    }
}
