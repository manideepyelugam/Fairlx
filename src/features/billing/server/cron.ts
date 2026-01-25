import "server-only";

import { Hono } from "hono";

import {
    processBillingCycle,
    enforceGracePeriods
} from "@/features/billing/services/billing-service";
import { sendGracePeriodReminders } from "@/features/billing/services/reminder-service";
import { evaluateAllAlerts } from "@/lib/alert-evaluation-job";


/**
 * Billing Cron Job Endpoints
 * 
 * These endpoints are called by external cron services (e.g., Vercel Cron, GitHub Actions).
 * They should be protected by a secret key in production.
 * 
 * SCHEDULE RECOMMENDATIONS:
 * - /cron/billing/process-cycle: Run at midnight UTC on the 1st of each month
 * - /cron/billing/enforce-grace: Run daily at 1:00 AM UTC
 * - /cron/billing/send-reminders: Run daily at 9:00 AM UTC (user-friendly time)
 * 
 * SECURITY:
 * - All cron endpoints require a secret key header
 * - Logs all executions for audit trail
 */

const CRON_SECRET = process.env.CRON_SECRET || "";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Verify cron request is authorized
 * 
 * SECURITY:
 * - In production: CRON_SECRET MUST be configured
 * - In development: Allows bypass with warning for testing
 */
function verifyCronSecret(authHeader: string | undefined): boolean {
    if (!CRON_SECRET) {
        if (IS_DEVELOPMENT) {
            console.warn("[Cron] CRON_SECRET not configured - allowing request in DEV mode only!");
            return true;
        }
        // PRODUCTION: Must have secret configured
        console.error("[Cron] CRITICAL: CRON_SECRET not configured in production!");
        return false;
    }

    if (!authHeader) {
        return false;
    }

    // Support both "Bearer <secret>" and plain secret
    const secret = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    return secret === CRON_SECRET;
}

const app = new Hono()
    /**
     * POST /cron/billing/process-cycle
     * 
     * Process billing cycle for all active accounts.
     * Run at the start of each month to:
     * 1. Generate invoices for previous month
     * 2. Advance billing cycle dates
     * 
     * Schedule: 0 0 1 * * (midnight on 1st of each month)
     */
    .post("/billing/process-cycle", async (c) => {
        const authHeader = c.req.header("Authorization");

        if (!verifyCronSecret(authHeader)) {
            console.warn("[Cron] Unauthorized billing cycle request");
            return c.json({ error: "Unauthorized" }, 401);
        }

        console.log("[Cron] Starting billing cycle processing...");
        const startTime = Date.now();

        try {
            const results = await processBillingCycle();

            const duration = Date.now() - startTime;
            console.log(`[Cron] Billing cycle completed in ${duration}ms`);

            return c.json({
                success: true,
                processed: results.processed,
                invoicesGenerated: results.invoices.length,
                invoiceIds: results.invoices,
                errors: results.errors,
                durationMs: duration,
            });
        } catch (error) {
            console.error("[Cron] Billing cycle failed:", error);
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    })

    /**
     * POST /cron/billing/enforce-grace
     * 
     * Check and enforce grace periods for all DUE accounts.
     * Suspends accounts where grace period has expired.
     * 
     * Schedule: 0 1 * * * (daily at 1 AM UTC)
     */
    .post("/billing/enforce-grace", async (c) => {
        const authHeader = c.req.header("Authorization");

        if (!verifyCronSecret(authHeader)) {
            console.warn("[Cron] Unauthorized grace period enforcement request");
            return c.json({ error: "Unauthorized" }, 401);
        }

        console.log("[Cron] Starting grace period enforcement...");
        const startTime = Date.now();

        try {
            const results = await enforceGracePeriods();

            const duration = Date.now() - startTime;
            console.log(`[Cron] Grace period enforcement completed in ${duration}ms`);

            return c.json({
                success: true,
                accountsChecked: results.checked,
                accountsSuspended: results.suspended.length,
                suspendedIds: results.suspended,
                durationMs: duration,
            });
        } catch (error) {
            console.error("[Cron] Grace period enforcement failed:", error);
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    })

    /**
     * POST /cron/billing/send-reminders
     * 
     * Send reminder emails to accounts in DUE status.
     * Sends at day 1, 7, and 13 of grace period.
     * 
     * Schedule: 0 9 * * * (daily at 9 AM UTC)
     */
    .post("/billing/send-reminders", async (c) => {
        const authHeader = c.req.header("Authorization");

        if (!verifyCronSecret(authHeader)) {
            console.warn("[Cron] Unauthorized reminder request");
            return c.json({ error: "Unauthorized" }, 401);
        }

        console.log("[Cron] Starting reminder email processing...");
        const startTime = Date.now();

        try {
            const results = await sendGracePeriodReminders();

            const duration = Date.now() - startTime;
            console.log(`[Cron] Reminder processing completed in ${duration}ms`);

            return c.json({
                success: true,
                accountsProcessed: results.processed,
                remindersSent: results.sent,
                results: results.results,
                durationMs: duration,
            });
        } catch (error) {
            console.error("[Cron] Reminder processing failed:", error);
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    })

    /**
     * POST /cron/billing/evaluate-alerts
     * 
     * Evaluate usage alerts for all active accounts.
     * Triggers notifications if thresholds trigger.
     * 
     * Schedule: Hourly
     */
    .post("/billing/evaluate-alerts", async (c) => {
        const authHeader = c.req.header("Authorization");

        if (!verifyCronSecret(authHeader)) {
            console.warn("[Cron] Unauthorized alert evaluation request");
            return c.json({ error: "Unauthorized" }, 401);
        }

        console.log("[Cron] Starting alert evaluation...");
        const startTime = Date.now();

        try {
            const { createAdminClient } = await import("@/lib/appwrite");
            const { databases: adminDb } = await createAdminClient();

            const results = await evaluateAllAlerts(adminDb);

            const duration = Date.now() - startTime;
            console.log(`[Cron] Alert evaluation completed in ${duration}ms`);

            return c.json({
                success: true,
                alertsEvaluated: results.length,
                alertsTriggered: results.filter(r => r.triggered).length,
                results: results,
                durationMs: duration,
            });
        } catch (error) {
            console.error("[Cron] Alert evaluation failed:", error);
            return c.json({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    })

    /**
     * GET /cron/health
     * 
     * Health check endpoint for monitoring.
     */
    .get("/health", (c) => {
        return c.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            endpoints: [
                "POST /cron/billing/process-cycle",
                "POST /cron/billing/enforce-grace",
                "POST /cron/billing/send-reminders",
            ],
        });
    });

export default app;
