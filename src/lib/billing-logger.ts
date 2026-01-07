import "server-only";

/**
 * Billing Logger - Structured operational logging
 * 
 * Provides consistent, structured logging for billing operations.
 * All logs use [BILLING] prefix for easy filtering.
 * 
 * Log Levels:
 * - INFO: Normal operations
 * - WARN: Potential issues, retries
 * - ERROR: Failures requiring attention
 * - ALERT: Critical issues requiring immediate action
 * 
 * USAGE:
 * import { billingLog } from "@/lib/billing-logger";
 * billingLog.info("Invoice generated", { invoiceId, amount });
 */

// ============================================================================
// LOG LEVELS
// ============================================================================

export type LogLevel = "INFO" | "WARN" | "ERROR" | "ALERT";

// ============================================================================
// STRUCTURED LOG TYPES
// ============================================================================

interface BaseLogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    context?: Record<string, unknown>;
}

interface InvoiceLogEntry extends BaseLogEntry {
    category: "INVOICE";
    invoiceId?: string;
    billingAccountId?: string;
    amount?: number;
}

interface WebhookLogEntry extends BaseLogEntry {
    category: "WEBHOOK";
    eventId?: string;
    eventType?: string;
    retryCount?: number;
    signature?: string;
}

interface StatusLogEntry extends BaseLogEntry {
    category: "STATUS_TRANSITION";
    billingAccountId?: string;
    fromStatus?: string;
    toStatus?: string;
}

interface JobLogEntry extends BaseLogEntry {
    category: "JOB";
    jobName?: string;
    jobId?: string;
    duration?: number;
}

type LogEntry = InvoiceLogEntry | WebhookLogEntry | StatusLogEntry | JobLogEntry | BaseLogEntry;

// ============================================================================
// CORE LOGGING FUNCTION
// ============================================================================

function formatLog(entry: LogEntry): string {
    const { timestamp, level, category, message, ...rest } = entry;
    const contextStr = Object.keys(rest).length > 0
        ? ` ${JSON.stringify(rest)}`
        : "";
    return `[${timestamp}][BILLING][${level}][${category}] ${message}${contextStr}`;
}

function log(entry: LogEntry): void {
    const formatted = formatLog(entry);

    switch (entry.level) {
        case "ALERT":
        case "ERROR":
            console.error(formatted);
            break;
        case "WARN":
            console.warn(formatted);
            break;
        default:
            console.log(formatted);
    }
}

// ============================================================================
// PUBLIC LOGGING API
// ============================================================================

export const billingLog = {
    /**
     * Log informational message
     */
    info(category: string, message: string, context?: Record<string, unknown>): void {
        log({
            timestamp: new Date().toISOString(),
            level: "INFO",
            category,
            message,
            context,
        });
    },

    /**
     * Log warning message
     */
    warn(category: string, message: string, context?: Record<string, unknown>): void {
        log({
            timestamp: new Date().toISOString(),
            level: "WARN",
            category,
            message,
            context,
        });
    },

    /**
     * Log error message
     */
    error(category: string, message: string, context?: Record<string, unknown>): void {
        log({
            timestamp: new Date().toISOString(),
            level: "ERROR",
            category,
            message,
            context,
        });
    },

    /**
     * Log critical alert (requires immediate attention)
     */
    alert(category: string, message: string, context?: Record<string, unknown>): void {
        log({
            timestamp: new Date().toISOString(),
            level: "ALERT",
            category,
            message,
            context,
        });
    },
};

// ============================================================================
// SPECIALIZED LOGGERS
// ============================================================================

/**
 * Invoice generation logging
 */
export const invoiceLog = {
    started(billingAccountId: string, period: string): void {
        billingLog.info("INVOICE", "Invoice generation started", { billingAccountId, period });
    },

    success(invoiceId: string, billingAccountId: string, amount: number): void {
        billingLog.info("INVOICE", "Invoice generated successfully", {
            invoiceId,
            billingAccountId,
            amount
        });
    },

    skipped(billingAccountId: string, reason: string): void {
        billingLog.info("INVOICE", "Invoice generation skipped", { billingAccountId, reason });
    },

    failed(billingAccountId: string, error: string): void {
        billingLog.error("INVOICE", "Invoice generation failed", { billingAccountId, error });
    },

    duplicate(billingAccountId: string, existingInvoiceId: string): void {
        billingLog.info("INVOICE", "Duplicate invoice request - returning existing", {
            billingAccountId,
            existingInvoiceId
        });
    },
};

/**
 * Webhook processing logging
 */
export const webhookLog = {
    received(eventId: string, eventType: string): void {
        billingLog.info("WEBHOOK", "Webhook received", { eventId, eventType });
    },

    verified(eventId: string): void {
        billingLog.info("WEBHOOK", "Webhook signature verified", { eventId });
    },

    verificationFailed(eventId: string, error: string): void {
        billingLog.error("WEBHOOK", "Webhook signature verification failed", { eventId, error });
    },

    processed(eventId: string, eventType: string): void {
        billingLog.info("WEBHOOK", "Webhook processed successfully", { eventId, eventType });
    },

    skippedDuplicate(eventId: string): void {
        billingLog.info("WEBHOOK", "Webhook skipped - already processed", { eventId });
    },

    retrying(eventId: string, retryCount: number, reason: string): void {
        billingLog.warn("WEBHOOK", "Webhook retry requested", { eventId, retryCount, reason });
    },

    failed(eventId: string, error: string, retryCount?: number): void {
        billingLog.error("WEBHOOK", "Webhook processing failed", { eventId, error, retryCount });
    },

    maxRetriesExceeded(eventId: string, retryCount: number): void {
        billingLog.alert("WEBHOOK", "Webhook max retries exceeded - requires manual intervention", {
            eventId,
            retryCount
        });
    },
};

/**
 * Billing status transition logging
 */
export const statusLog = {
    transition(billingAccountId: string, from: string, to: string, reason?: string): void {
        billingLog.info("STATUS", `Status transition: ${from} -> ${to}`, {
            billingAccountId,
            from,
            to,
            reason
        });
    },

    invalidTransition(billingAccountId: string, from: string, to: string): void {
        billingLog.error("STATUS", `Invalid status transition attempted: ${from} -> ${to}`, {
            billingAccountId,
            from,
            to
        });
    },

    suspended(billingAccountId: string, reason: string): void {
        billingLog.warn("STATUS", "Account suspended", { billingAccountId, reason });
    },

    restored(billingAccountId: string): void {
        billingLog.info("STATUS", "Account restored to active", { billingAccountId });
    },

    nearSuspension(billingAccountId: string, hoursRemaining: number): void {
        billingLog.warn("STATUS", `Account nearing suspension - ${hoursRemaining}h remaining`, {
            billingAccountId,
            hoursRemaining
        });
    },
};

/**
 * Background job logging
 */
export const jobLog = {
    started(jobName: string, jobId?: string): void {
        billingLog.info("JOB", `Job started: ${jobName}`, { jobName, jobId });
    },

    completed(jobName: string, duration: number, jobId?: string): void {
        billingLog.info("JOB", `Job completed: ${jobName}`, { jobName, jobId, duration });
    },

    failed(jobName: string, error: string, jobId?: string): void {
        billingLog.error("JOB", `Job failed: ${jobName}`, { jobName, jobId, error });
    },

    skipped(jobName: string, reason: string): void {
        billingLog.info("JOB", `Job skipped: ${jobName}`, { jobName, reason });
    },
};

/**
 * Billing cycle lock logging
 */
export const lockLog = {
    acquired(billingAccountId: string, lockTimestamp: string): void {
        billingLog.info("LOCK", "Billing cycle locked", { billingAccountId, lockTimestamp });
    },

    alreadyLocked(billingAccountId: string, existingLockTimestamp: string): void {
        billingLog.info("LOCK", "Billing cycle already locked (idempotent)", {
            billingAccountId,
            existingLockTimestamp
        });
    },

    raceLost(billingAccountId: string, attemptedTimestamp: string, winningTimestamp: string): void {
        billingLog.warn("LOCK", "Lock race lost - another process acquired lock", {
            billingAccountId,
            attemptedTimestamp,
            winningTimestamp
        });
    },

    released(billingAccountId: string): void {
        billingLog.info("LOCK", "Billing cycle unlocked", { billingAccountId });
    },

    failed(billingAccountId: string, error: string): void {
        billingLog.error("LOCK", "Failed to acquire lock", { billingAccountId, error });
    },
};

/**
 * Invariant violation logging
 */
export const invariantLog = {
    violation(invariant: string, message: string, context?: Record<string, unknown>): void {
        billingLog.alert("INVARIANT", `VIOLATION: [${invariant}] ${message}`, context);
    },

    check(invariant: string, passed: boolean, context?: Record<string, unknown>): void {
        if (passed) {
            billingLog.info("INVARIANT", `Check passed: ${invariant}`, context);
        } else {
            billingLog.warn("INVARIANT", `Check failed: ${invariant}`, context);
        }
    },
};
