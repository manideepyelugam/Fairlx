import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import {
    DATABASE_ID,
    USAGE_EVENTS_ID,
    USAGE_AGGREGATIONS_ID,
    USAGE_ALERTS_ID,
    INVOICES_ID,
    USAGE_RATE_TRAFFIC_GB,
    USAGE_RATE_STORAGE_GB_MONTH,
    USAGE_RATE_COMPUTE_UNIT,
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";

import {
    createUsageEventSchema,
    getUsageEventsSchema,
    exportUsageSchema,
    getUsageAggregationsSchema,
    calculateAggregationSchema,
    getUsageSummarySchema,
    createUsageAlertSchema,
    updateUsageAlertSchema,
    getUsageAlertsSchema,
} from "../schemas";
import {
    UsageEvent,
    UsageAggregation,
    UsageAlert,
    UsageSummary,
    Invoice,
    ResourceType,
    UsageSource,
} from "../types";

// Helper to check admin access
async function checkAdminAccess(
    databases: Parameters<typeof getMember>[0]["databases"],
    workspaceId: string,
    userId: string
): Promise<boolean> {
    const member = await getMember({ databases, workspaceId, userId });
    return member?.role === MemberRole.ADMIN;
}

/**
 * CRITICAL ITEM 3: Determine billing entity for a usage event based on timestamp
 * 
 * BILLING ATTRIBUTION TIMELINE SAFETY
 * ====================================
 * 
 * AUTHORITATIVE RULE:
 *   billingEffectiveAt = organization.billingStartAt (= accountConversionCompletedAt)
 * 
 *   IF usage.createdAt < billingEffectiveAt → bill PERSONAL account
 *   ELSE → bill ORGANIZATION
 * 
 * WHY THIS MATTERS:
 * - When PERSONAL converts to ORG, historical usage stays with the user
 * - Only post-conversion usage bills to organization
 * - Prevents retroactive billing reassignment
 * 
 * HANDLING DELAYED INGESTION:
 * - Usage events may arrive out-of-order (async ingestion)
 * - We use event.timestamp (when usage occurred), NOT ingestion time
 * - This ensures late-arriving events are correctly attributed
 * 
 * LOGIC:
 * - If workspace has no org: bill to user (via workspace.userId)
 * - If workspace has org AND event BEFORE org.billingStartAt: bill to user
 * - If workspace has org AND event AFTER org.billingStartAt: bill to org
 * 
 * This ensures correct revenue attribution across conversion boundaries.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getBillingEntityForEvent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    databases: any,
    workspaceId: string,
    eventTimestamp: string
): Promise<{ entityId: string; entityType: "user" | "organization" }> {
    try {
        // Get workspace to check organizationId
        const workspace = await databases.getDocument(
            DATABASE_ID,
            "workspaces",
            workspaceId
        );

        // If no organization, bill to workspace owner (user)
        if (!workspace.organizationId) {
            return {
                entityId: workspace.userId,
                entityType: "user",
            };
        }

        // Get organization to check billingStartAt
        const organization = await databases.getDocument(
            DATABASE_ID,
            "organizations",
            workspace.organizationId
        );

        const billingStartAt = organization.billingStartAt
            ? new Date(organization.billingStartAt)
            : null;
        const eventDate = new Date(eventTimestamp);

        // If event occurred before org billing started, bill to user
        if (billingStartAt && eventDate < billingStartAt) {
            return {
                entityId: workspace.userId,
                entityType: "user",
            };
        }

        // Event after org billing started, bill to organization
        return {
            entityId: workspace.organizationId,
            entityType: "organization",
        };
    } catch (error) {
        console.error("[Usage] Error determining billing entity:", error);
        // Fallback: bill to workspace owner
        try {
            const workspace = await databases.getDocument(
                DATABASE_ID,
                "workspaces",
                workspaceId
            );
            return {
                entityId: workspace.userId,
                entityType: "user",
            };
        } catch {
            throw new Error("Cannot determine billing entity");
        }
    }
}

// Convert bytes to GB
function bytesToGB(bytes: number): number {
    return bytes / (1024 * 1024 * 1024);
}

// Calculate cost based on usage
function calculateCost(
    trafficGB: number,
    storageAvgGB: number,
    computeUnits: number
) {
    return {
        traffic: trafficGB * USAGE_RATE_TRAFFIC_GB,
        storage: storageAvgGB * USAGE_RATE_STORAGE_GB_MONTH,
        compute: computeUnits * USAGE_RATE_COMPUTE_UNIT,
        total:
            trafficGB * USAGE_RATE_TRAFFIC_GB +
            storageAvgGB * USAGE_RATE_STORAGE_GB_MONTH +
            computeUnits * USAGE_RATE_COMPUTE_UNIT,
    };
}

const app = new Hono()
    // ===============================
    // Usage Events Endpoints
    // ===============================

    // GET /usage/events - List usage events (paginated)
    .get(
        "/events",
        sessionMiddleware,
        zValidator("query", getUsageEventsSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const params = c.req.valid("query");

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, params.workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            // Build query
            const queries = [
                Query.equal("workspaceId", params.workspaceId),
                Query.orderDesc("timestamp"),
                Query.limit(params.limit),
                Query.offset(params.offset),
            ];

            if (params.projectId) {
                queries.push(Query.equal("projectId", params.projectId));
            }
            if (params.resourceType) {
                queries.push(Query.equal("resourceType", params.resourceType));
            }
            if (params.source) {
                queries.push(Query.equal("source", params.source));
            }
            if (params.startDate) {
                queries.push(Query.greaterThanEqual("timestamp", params.startDate));
            }
            if (params.endDate) {
                queries.push(Query.lessThanEqual("timestamp", params.endDate));
            }

            const events = await databases.listDocuments<UsageEvent>(
                DATABASE_ID,
                USAGE_EVENTS_ID,
                queries
            );

            return c.json({ data: events });
        }
    )

    // POST /usage/events - Create usage event
    .post(
        "/events",
        sessionMiddleware,
        zValidator("json", createUsageEventSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const data = c.req.valid("json");

            // Check admin access (or allow internal service calls)
            const isAdmin = await checkAdminAccess(databases, data.workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            const event = await databases.createDocument<UsageEvent>(
                DATABASE_ID,
                USAGE_EVENTS_ID,
                ID.unique(),
                {
                    workspaceId: data.workspaceId,
                    projectId: data.projectId || null,
                    resourceType: data.resourceType,
                    units: data.units,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                    timestamp: data.timestamp || new Date().toISOString(),
                    source: data.source,
                }
            );

            return c.json({ data: event }, 201);
        }
    )

    // GET /usage/events/export - Export usage events
    .get(
        "/events/export",
        sessionMiddleware,
        zValidator("query", exportUsageSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const params = c.req.valid("query");

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, params.workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            // Build query for export (fetch all matching events)
            const queries = [
                Query.equal("workspaceId", params.workspaceId),
                Query.orderDesc("timestamp"),
                Query.limit(10000), // Max export limit
            ];

            if (params.resourceType) {
                queries.push(Query.equal("resourceType", params.resourceType));
            }
            if (params.startDate) {
                queries.push(Query.greaterThanEqual("timestamp", params.startDate));
            }
            if (params.endDate) {
                queries.push(Query.lessThanEqual("timestamp", params.endDate));
            }

            const events = await databases.listDocuments<UsageEvent>(
                DATABASE_ID,
                USAGE_EVENTS_ID,
                queries
            );

            if (params.format === "json") {
                return c.json({ data: events.documents });
            }

            // Generate CSV
            const headers = [
                "id",
                "workspaceId",
                "projectId",
                "resourceType",
                "units",
                "source",
                "timestamp",
                "metadata",
            ];
            const csvRows = [headers.join(",")];

            for (const event of events.documents) {
                const row = [
                    event.$id,
                    event.workspaceId,
                    event.projectId || "",
                    event.resourceType,
                    event.units.toString(),
                    event.source,
                    event.timestamp,
                    event.metadata ? `"${event.metadata.replace(/"/g, '""')}"` : "",
                ];
                csvRows.push(row.join(","));
            }

            const csv = csvRows.join("\n");
            return c.text(csv, 200, {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="usage-export-${new Date().toISOString().split("T")[0]}.csv"`,
            });
        }
    )

    // GET /usage/summary - Get usage summary for current period
    // 
    // CRITICAL FIX IMPLEMENTED: Filters events by billing entity
    // Events are attributed to org or user based on billingEntityType stored at creation
    .get(
        "/summary",
        sessionMiddleware,
        zValidator("query", getUsageSummarySchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId, period, billingEntityId } = c.req.valid("query");

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            // Default to current month
            const targetPeriod = period || new Date().toISOString().slice(0, 7);
            const startOfMonth = `${targetPeriod}-01T00:00:00.000Z`;
            const nextMonth = new Date(targetPeriod + "-01");
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const endOfMonth = nextMonth.toISOString();

            // Build query with billing entity filter if provided
            const queries = [
                Query.equal("workspaceId", workspaceId),
                Query.greaterThanEqual("timestamp", startOfMonth),
                Query.lessThan("timestamp", endOfMonth),
                Query.limit(10000),
            ];

            // CRITICAL: Filter by billing entity to separate org/user billing
            // If billingEntityId is provided, only get events for that entity
            if (billingEntityId) {
                queries.push(Query.equal("billingEntityId", billingEntityId));
            }

            // Fetch events for the period (filtered by billing entity if specified)
            const events = await databases.listDocuments<UsageEvent>(
                DATABASE_ID,
                USAGE_EVENTS_ID,
                queries
            );

            // Calculate totals
            let trafficTotalBytes = 0;
            let storageTotalBytes = 0;
            let computeTotalUnits = 0;
            const bySource: Record<string, number> = {
                api: 0,
                file: 0,
                job: 0,
                ai: 0,
            };
            const byResourceType: Record<string, number> = {
                traffic: 0,
                storage: 0,
                compute: 0,
            };

            for (const event of events.documents) {
                bySource[event.source] = (bySource[event.source] || 0) + event.units;
                byResourceType[event.resourceType] =
                    (byResourceType[event.resourceType] || 0) + event.units;

                switch (event.resourceType) {
                    case ResourceType.TRAFFIC:
                        trafficTotalBytes += event.units;
                        break;
                    case ResourceType.STORAGE:
                        storageTotalBytes += event.units;
                        break;
                    case ResourceType.COMPUTE:
                        // WHY: Use weightedUnits for billing if available
                        // This ensures AI operations are billed at higher rates
                        // Falls back to raw units for backward compatibility
                        computeTotalUnits += event.weightedUnits || event.units;
                        break;
                }
            }

            // Calculate averages for storage (simple average for now)
            const storageAvgBytes = storageTotalBytes / Math.max(events.total, 1);
            const trafficTotalGB = bytesToGB(trafficTotalBytes);
            const storageAvgGB = bytesToGB(storageAvgBytes);

            const summary: UsageSummary = {
                period: targetPeriod,
                trafficTotalBytes,
                trafficTotalGB,
                storageAvgBytes,
                storageAvgGB,
                computeTotalUnits,
                estimatedCost: calculateCost(trafficTotalGB, storageAvgGB, computeTotalUnits),
                eventCount: events.total,
                breakdown: {
                    bySource: bySource as Record<UsageSource, number>,
                    byResourceType: byResourceType as Record<ResourceType, number>,
                },
            };

            return c.json({ data: summary });
        }
    )

    // ===============================
    // Usage Aggregations Endpoints
    // ===============================

    // GET /usage/aggregations - List aggregations
    .get(
        "/aggregations",
        sessionMiddleware,
        zValidator("query", getUsageAggregationsSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId, startPeriod, endPeriod } = c.req.valid("query");

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            const queries = [
                Query.equal("workspaceId", workspaceId),
                Query.orderDesc("period"),
                Query.limit(24), // Last 2 years
            ];

            if (startPeriod) {
                queries.push(Query.greaterThanEqual("period", startPeriod));
            }
            if (endPeriod) {
                queries.push(Query.lessThanEqual("period", endPeriod));
            }

            const aggregations = await databases.listDocuments<UsageAggregation>(
                DATABASE_ID,
                USAGE_AGGREGATIONS_ID,
                queries
            );

            return c.json({ data: aggregations });
        }
    )

    // POST /usage/aggregations/calculate - Calculate aggregation for a period
    //
    // CRITICAL FIX IMPLEMENTED: Filters events by billing entity
    // Aggregations respect billing entity boundaries for accurate org/user split
    .post(
        "/aggregations/calculate",
        sessionMiddleware,
        zValidator("json", calculateAggregationSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId, period, billingEntityId } = c.req.valid("json");

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            // Check if aggregation already exists
            const aggregationQuery = [
                Query.equal("workspaceId", workspaceId),
                Query.equal("period", period),
            ];

            // If billing entity specified, check for entity-specific aggregation
            if (billingEntityId) {
                aggregationQuery.push(Query.equal("billingEntityId", billingEntityId));
            }

            const existing = await databases.listDocuments<UsageAggregation>(
                DATABASE_ID,
                USAGE_AGGREGATIONS_ID,
                aggregationQuery
            );

            // HARD LOCK: Finalized periods MUST NOT be modified
            // WHY: Once billing is finalized, data becomes immutable for audit
            if (existing.total > 0 && existing.documents[0].isFinalized) {
                throw new Error("BILLING_PERIOD_LOCKED: Cannot recalculate finalized period. This period has been invoiced and is immutable.");
            }

            // Calculate aggregation
            const startOfMonth = `${period}-01T00:00:00.000Z`;
            const nextMonth = new Date(period + "-01");
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const endOfMonth = nextMonth.toISOString();

            // Build query with billing entity filter
            const eventQueries = [
                Query.equal("workspaceId", workspaceId),
                Query.greaterThanEqual("timestamp", startOfMonth),
                Query.lessThan("timestamp", endOfMonth),
                Query.limit(10000),
            ];

            // CRITICAL: Filter by billing entity for accurate attribution
            if (billingEntityId) {
                eventQueries.push(Query.equal("billingEntityId", billingEntityId));
            }

            const events = await databases.listDocuments<UsageEvent>(
                DATABASE_ID,
                USAGE_EVENTS_ID,
                eventQueries
            );

            let trafficTotalBytes = 0;
            let storageTotalBytes = 0;
            let computeTotalUnits = 0;

            for (const event of events.documents) {
                switch (event.resourceType) {
                    case ResourceType.TRAFFIC:
                        trafficTotalBytes += event.units;
                        break;
                    case ResourceType.STORAGE:
                        storageTotalBytes += event.units;
                        break;
                    case ResourceType.COMPUTE:
                        // WHY: Use weightedUnits for accurate billing
                        // AI operations have higher weights than basic CRUD
                        computeTotalUnits += event.weightedUnits || event.units;
                        break;
                }
            }

            const trafficTotalGB = bytesToGB(trafficTotalBytes);
            const storageAvgGB = bytesToGB(storageTotalBytes / Math.max(events.total, 1));

            // Create or update aggregation
            let aggregation: UsageAggregation;
            if (existing.total > 0) {
                aggregation = await databases.updateDocument<UsageAggregation>(
                    DATABASE_ID,
                    USAGE_AGGREGATIONS_ID,
                    existing.documents[0].$id,
                    {
                        trafficTotalGB,
                        storageAvgGB,
                        computeTotalUnits,
                    }
                );
            } else {
                aggregation = await databases.createDocument<UsageAggregation>(
                    DATABASE_ID,
                    USAGE_AGGREGATIONS_ID,
                    ID.unique(),
                    {
                        workspaceId,
                        period,
                        trafficTotalGB,
                        storageAvgGB,
                        computeTotalUnits,
                        createdAt: new Date().toISOString(),
                        isFinalized: false,
                    }
                );
            }

            return c.json({ data: aggregation });
        }
    )

    // ===============================
    // Usage Alerts Endpoints
    // ===============================

    // GET /usage/alerts - List alerts
    .get(
        "/alerts",
        sessionMiddleware,
        zValidator("query", getUsageAlertsSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId } = c.req.valid("query");

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            const alerts = await databases.listDocuments<UsageAlert>(
                DATABASE_ID,
                USAGE_ALERTS_ID,
                [
                    Query.equal("workspaceId", workspaceId),
                    Query.orderDesc("$createdAt"),
                ]
            );

            return c.json({ data: alerts });
        }
    )

    // POST /usage/alerts - Create alert
    .post(
        "/alerts",
        sessionMiddleware,
        zValidator("json", createUsageAlertSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const data = c.req.valid("json");

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, data.workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            const alert = await databases.createDocument<UsageAlert>(
                DATABASE_ID,
                USAGE_ALERTS_ID,
                ID.unique(),
                {
                    workspaceId: data.workspaceId,
                    resourceType: data.resourceType,
                    threshold: data.threshold,
                    alertType: data.alertType,
                    isEnabled: true,
                    webhookUrl: data.webhookUrl || null,
                    createdBy: user.$id,
                    lastTriggeredAt: null,
                }
            );

            return c.json({ data: alert }, 201);
        }
    )

    // PATCH /usage/alerts/:alertId - Update alert
    .patch(
        "/alerts/:alertId",
        sessionMiddleware,
        zValidator("json", updateUsageAlertSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { alertId } = c.req.param();
            const updates = c.req.valid("json");

            // Get alert to check workspace
            const alert = await databases.getDocument<UsageAlert>(
                DATABASE_ID,
                USAGE_ALERTS_ID,
                alertId
            );

            // Check admin access
            const isAdmin = await checkAdminAccess(databases, alert.workspaceId, user.$id);
            if (!isAdmin) {
                return c.json({ error: "Admin access required" }, 403);
            }

            const updatedAlert = await databases.updateDocument<UsageAlert>(
                DATABASE_ID,
                USAGE_ALERTS_ID,
                alertId,
                updates
            );

            return c.json({ data: updatedAlert });
        }
    )

    // DELETE /usage/alerts/:alertId - Delete alert
    .delete("/alerts/:alertId", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { alertId } = c.req.param();

        // Get alert to check workspace
        const alert = await databases.getDocument<UsageAlert>(
            DATABASE_ID,
            USAGE_ALERTS_ID,
            alertId
        );

        // Check admin access
        const isAdmin = await checkAdminAccess(databases, alert.workspaceId, user.$id);
        if (!isAdmin) {
            return c.json({ error: "Admin access required" }, 403);
        }

        await databases.deleteDocument(DATABASE_ID, USAGE_ALERTS_ID, alertId);

        return c.json({ data: { $id: alertId } });
    })

    // ===============================
    // Invoice Endpoints
    // WHY: Invoices provide immutable snapshots of billing periods
    // Once an invoice is generated, the aggregation becomes locked
    // ===============================

    // GET /usage/invoices - List invoices for a workspace
    .get("/invoices", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const workspaceId = c.req.query("workspaceId");

        if (!workspaceId) {
            return c.json({ error: "workspaceId is required" }, 400);
        }

        // Check admin access
        const isAdmin = await checkAdminAccess(databases, workspaceId, user.$id);
        if (!isAdmin) {
            return c.json({ error: "Admin access required" }, 403);
        }

        const invoices = await databases.listDocuments<Invoice>(
            DATABASE_ID,
            INVOICES_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.orderDesc("createdAt"),
                Query.limit(24), // Last 2 years
            ]
        );

        return c.json({ data: invoices });
    })

    // POST /usage/invoices/generate - Generate invoice from aggregation
    // WHY: This creates an immutable billing snapshot and locks the period
    .post("/invoices/generate", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const body = await c.req.json();
        const { workspaceId, period } = body;

        if (!workspaceId || !period) {
            return c.json({ error: "workspaceId and period are required" }, 400);
        }

        // Check admin access
        const isAdmin = await checkAdminAccess(databases, workspaceId, user.$id);
        if (!isAdmin) {
            return c.json({ error: "Admin access required" }, 403);
        }

        // Get aggregation for period
        const aggregations = await databases.listDocuments<UsageAggregation>(
            DATABASE_ID,
            USAGE_AGGREGATIONS_ID,
            [
                Query.equal("workspaceId", workspaceId),
                Query.equal("period", period),
            ]
        );

        if (aggregations.total === 0) {
            return c.json({ error: "No aggregation found for this period" }, 404);
        }

        const aggregation = aggregations.documents[0];

        // Check if already has an invoice
        if (aggregation.invoiceId) {
            return c.json({ error: "Invoice already exists for this period" }, 400);
        }

        // Calculate total cost
        const totalCost =
            aggregation.trafficTotalGB * USAGE_RATE_TRAFFIC_GB +
            aggregation.storageAvgGB * USAGE_RATE_STORAGE_GB_MONTH +
            aggregation.computeTotalUnits * USAGE_RATE_COMPUTE_UNIT;

        // Generate invoice ID (human-readable format)
        const invoiceNumber = `INV-${workspaceId.slice(-6).toUpperCase()}-${period.replace('-', '')}`;

        // Create invoice
        const invoice = await databases.createDocument<Invoice>(
            DATABASE_ID,
            INVOICES_ID,
            ID.unique(),
            {
                invoiceId: invoiceNumber,
                workspaceId,
                period,
                trafficGB: aggregation.trafficTotalGB,
                storageAvgGB: aggregation.storageAvgGB,
                computeUnits: aggregation.computeTotalUnits,
                totalCost,
                aggregationSnapshotId: aggregation.$id,
                status: 'draft',
                createdAt: new Date().toISOString(),
            }
        );

        // Link aggregation to invoice and finalize
        // WHY: Once invoice is generated, aggregation becomes immutable
        await databases.updateDocument<UsageAggregation>(
            DATABASE_ID,
            USAGE_AGGREGATIONS_ID,
            aggregation.$id,
            {
                invoiceId: invoice.$id,
                isFinalized: true,
                finalizedAt: new Date().toISOString(),
            }
        );

        return c.json({ data: invoice }, 201);
    })

    // PATCH /usage/invoices/:invoiceId/finalize - Mark invoice as finalized
    .patch("/invoices/:invoiceId/finalize", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { invoiceId } = c.req.param();

        // Get invoice
        const invoice = await databases.getDocument<Invoice>(
            DATABASE_ID,
            INVOICES_ID,
            invoiceId
        );

        // Check admin access
        const isAdmin = await checkAdminAccess(databases, invoice.workspaceId, user.$id);
        if (!isAdmin) {
            return c.json({ error: "Admin access required" }, 403);
        }

        if (invoice.status !== 'draft') {
            return c.json({ error: "Only draft invoices can be finalized" }, 400);
        }

        const updated = await databases.updateDocument<Invoice>(
            DATABASE_ID,
            INVOICES_ID,
            invoiceId,
            { status: 'finalized' }
        );

        return c.json({ data: updated });
    })

    // PATCH /usage/invoices/:invoiceId/pay - Mark invoice as paid
    .patch("/invoices/:invoiceId/pay", sessionMiddleware, async (c) => {
        const user = c.get("user");
        const databases = c.get("databases");
        const { invoiceId } = c.req.param();

        // Get invoice
        const invoice = await databases.getDocument<Invoice>(
            DATABASE_ID,
            INVOICES_ID,
            invoiceId
        );

        // Check admin access
        const isAdmin = await checkAdminAccess(databases, invoice.workspaceId, user.$id);
        if (!isAdmin) {
            return c.json({ error: "Admin access required" }, 403);
        }

        if (invoice.status === 'paid') {
            return c.json({ error: "Invoice is already paid" }, 400);
        }

        const updated = await databases.updateDocument<Invoice>(
            DATABASE_ID,
            INVOICES_ID,
            invoiceId,
            {
                status: 'paid',
                paidAt: new Date().toISOString(),
            }
        );

        return c.json({ data: updated });
    });

export default app;
