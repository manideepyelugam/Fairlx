import "server-only";

import { Databases, ID, Query } from "node-appwrite";

/**
 * Processed Events Registry
 * 
 * Database-backed idempotency tracking for:
 * - Usage event writes
 * - Invoice generation  
 * - Webhook processing
 * 
 * CRITICAL: This replaces in-memory Sets for production safety.
 * In-memory storage is lost on server restart, causing duplicate processing.
 * 
 * COLLECTION: processed_events (preferred) or billing_audit_logs (fallback)
 * FIELDS:
 * - eventKey/eventId: string (unique identifier)
 * - eventType: "usage" | "invoice" | "webhook"
 * - processedAt: ISO timestamp
 * - metadata: optional JSON for debugging
 */

import { DATABASE_ID, PROCESSED_EVENTS_ID, BILLING_AUDIT_LOGS_ID } from "@/config";

// Use dedicated collection if available, otherwise fallback to audit logs
const getCollectionId = (): string => {
    return PROCESSED_EVENTS_ID || BILLING_AUDIT_LOGS_ID;
};

const usesDedicatedCollection = (): boolean => {
    return Boolean(PROCESSED_EVENTS_ID);
};

/**
 * Event types for idempotency tracking
 */
export type ProcessedEventType = "usage" | "invoice" | "webhook";

/**
 * Processed event record
 */
export interface ProcessedEvent {
    eventKey: string;
    eventType: ProcessedEventType;
    processedAt: string;
    metadata?: Record<string, unknown>;
}

// In-memory cache for hot path (backed by DB for persistence)
const processedEventsCache = new Map<string, ProcessedEvent>();

// Cache size limit
const MAX_CACHE_SIZE = 10000;

/**
 * Check if an event has already been processed
 * 
 * Checks in-memory cache first, then falls back to database.
 * 
 * @param databases - Appwrite Databases instance
 * @param eventKey - Unique identifier for the event
 * @param eventType - Type of event (usage, invoice, webhook)
 * @returns true if already processed, false otherwise
 */
export async function isEventProcessed(
    databases: Databases,
    eventKey: string,
    eventType: ProcessedEventType
): Promise<boolean> {
    const cacheKey = `${eventType}:${eventKey}`;

    // 1. Check in-memory cache (fast path)
    if (processedEventsCache.has(cacheKey)) {
        return true;
    }

    // 2. Check database (persistent storage)
    try {
        const collectionId = getCollectionId();

        // Query differs based on collection type
        let queries;
        if (usesDedicatedCollection()) {
            // Dedicated processed_events collection
            queries = [
                Query.equal("eventId", eventKey),
                Query.equal("eventType", eventType),
                Query.limit(1),
            ];
        } else {
            // Fallback to billing audit logs
            queries = [
                Query.equal("eventType", `IDEMPOTENCY_${eventType.toUpperCase()}`),
                Query.contains("metadata", eventKey),
                Query.limit(1),
            ];
        }

        const existing = await databases.listDocuments(
            DATABASE_ID,
            collectionId,
            queries
        );

        if (existing.total > 0) {
            // Add to cache for future checks
            processedEventsCache.set(cacheKey, {
                eventKey,
                eventType,
                processedAt: existing.documents[0].$createdAt,
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error("[ProcessedEventsRegistry] isEventProcessed failed:", error);
        // On error, assume not processed (fail open for idempotency check)
        // This may cause duplicates, but that's safer than blocking operations
        return false;
    }
}

/**
 * Mark an event as processed
 * 
 * Stores in both in-memory cache and database for persistence.
 * 
 * @param databases - Appwrite Databases instance
 * @param eventKey - Unique identifier for the event
 * @param eventType - Type of event (usage, invoice, webhook)
 * @param metadata - Optional metadata for debugging
 */
export async function markEventProcessed(
    databases: Databases,
    eventKey: string,
    eventType: ProcessedEventType,
    metadata?: Record<string, unknown>
): Promise<void> {
    const cacheKey = `${eventType}:${eventKey}`;
    const processedAt = new Date().toISOString();

    // 1. Add to in-memory cache
    processedEventsCache.set(cacheKey, {
        eventKey,
        eventType,
        processedAt,
        metadata,
    });

    // Cleanup cache if it gets too large
    if (processedEventsCache.size > MAX_CACHE_SIZE) {
        // Remove oldest entries (first 1000)
        const iterator = processedEventsCache.keys();
        for (let i = 0; i < 1000; i++) {
            const key = iterator.next().value;
            if (key) processedEventsCache.delete(key);
        }
    }

    // 2. Persist to database
    try {
        const collectionId = getCollectionId();

        let documentData;
        if (usesDedicatedCollection()) {
            // Dedicated processed_events collection
            documentData = {
                eventId: eventKey,
                eventType,
                processedAt,
                metadata: JSON.stringify(metadata || {}),
            };
        } else {
            // Fallback to billing audit logs
            documentData = {
                billingAccountId: "SYSTEM_IDEMPOTENCY",
                eventType: `IDEMPOTENCY_${eventType.toUpperCase()}`,
                metadata: JSON.stringify({
                    eventKey,
                    eventType,
                    processedAt,
                    ...(metadata || {}),
                }),
            };
        }

        await databases.createDocument(
            DATABASE_ID,
            collectionId,
            ID.unique(),
            documentData
        );
    } catch (error) {
        // Log but don't throw - cache is still valid
        console.error("[ProcessedEventsRegistry] markEventProcessed failed:", error);
    }
}

/**
 * Check if event is processed (sync version using cache only)
 * 
 * Use this for hot paths where database latency is unacceptable.
 * Falls back to assuming not processed if not in cache.
 */
export function isEventProcessedSync(
    eventKey: string,
    eventType: ProcessedEventType
): boolean {
    const cacheKey = `${eventType}:${eventKey}`;
    return processedEventsCache.has(cacheKey);
}

/**
 * Clear processed events cache (for testing)
 */
export function clearProcessedEventsCache(): void {
    processedEventsCache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export function getProcessedEventsCacheStats(): {
    size: number;
    maxSize: number;
} {
    return {
        size: processedEventsCache.size,
        maxSize: MAX_CACHE_SIZE,
    };
}
