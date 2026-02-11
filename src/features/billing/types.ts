import { Models } from "node-appwrite";

// ===============================
// Billing Status Enum
// ===============================

/**
 * BillingStatus - tracks account billing state
 * 
 * ACTIVE: Wallet has funds, full access to all features
 * DUE: Wallet balance insufficient, in grace period (14 days) - full access with warnings
 * SUSPENDED: Grace period expired, restricted to billing pages only
 */
export enum BillingStatus {
    ACTIVE = "ACTIVE",
    DUE = "DUE",
    SUSPENDED = "SUSPENDED",
}

// ===============================
// Billing Account Type Enum
// ===============================

/**
 * BillingAccountType - matches AccountType but specific to billing
 * 
 * PERSONAL: Individual user account, billed directly
 * ORG: Organization account, billed to the organization
 */
export enum BillingAccountType {
    PERSONAL = "PERSONAL",
    ORG = "ORG",
}

// ===============================
// Billing Audit Event Types
// ===============================

/**
 * BillingAuditEventType - all trackable billing events
 * 
 * Used for compliance, debugging, and customer support.
 */
export enum BillingAuditEventType {
    // Wallet Events
    WALLET_TOPUP = "WALLET_TOPUP",
    WALLET_DEDUCTION = "WALLET_DEDUCTION",
    WALLET_REFUND = "WALLET_REFUND",
    WALLET_HOLD = "WALLET_HOLD",
    WALLET_RELEASE = "WALLET_RELEASE",

    // Invoice Events
    INVOICE_GENERATED = "INVOICE_GENERATED",
    INVOICE_FINALIZED = "INVOICE_FINALIZED",

    // Payment Events (Razorpay one-time)
    PAYMENT_ATTEMPTED = "PAYMENT_ATTEMPTED",
    PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    PAYMENT_AUTHORIZED = "PAYMENT_AUTHORIZED",

    // Grace Period Events
    GRACE_PERIOD_STARTED = "GRACE_PERIOD_STARTED",
    GRACE_PERIOD_REMINDER_SENT = "GRACE_PERIOD_REMINDER_SENT",
    GRACE_PERIOD_EXPIRING = "GRACE_PERIOD_EXPIRING",

    // Account Status Events
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
    ACCOUNT_RESTORED = "ACCOUNT_RESTORED",

    // Billing Account Events
    BILLING_ACCOUNT_CREATED = "BILLING_ACCOUNT_CREATED",

    // Refund Events
    REFUND_PROCESSED = "REFUND_PROCESSED",
    REFUND_FAILED = "REFUND_FAILED",

    // Webhook Events
    WEBHOOK_RECEIVED = "WEBHOOK_RECEIVED",
    WEBHOOK_PROCESSED = "WEBHOOK_PROCESSED",
    WEBHOOK_FAILED = "WEBHOOK_FAILED",
}

// ===============================
// Invoice Status
// ===============================

export enum InvoiceStatus {
    DRAFT = "DRAFT",       // Being generated, not yet finalized
    DUE = "DUE",           // Finalized, awaiting payment
    PAID = "PAID",         // Successfully paid (wallet deduction or Razorpay)
    FAILED = "FAILED",     // Wallet deduction failed (insufficient balance)
}

// ===============================
// Database Document Types
// ===============================

/**
 * BillingAccount - Core billing entity
 * 
 * Links either a userId (PERSONAL) or organizationId (ORG) to billing.
 * Tracks billing status and cycle dates.
 * 
 * WALLET-ONLY: All payments flow through the wallet. No mandates, no subscriptions.
 * 
 * INVARIANT: Each user/org has exactly one BillingAccount.
 */
export type BillingAccount = Models.Document & {
    /** Account type: PERSONAL or ORG */
    type: BillingAccountType;

    /** User ID (required for PERSONAL accounts) */
    userId?: string;

    /** Organization ID (required for ORG accounts) */
    organizationId?: string;

    /** Razorpay Customer ID (used for one-time top-up orders) */
    razorpayCustomerId: string;

    /** Current billing status */
    billingStatus: BillingStatus;

    /** Current billing cycle start (ISO datetime) */
    billingCycleStart: string;

    /** Current billing cycle end (ISO datetime) */
    billingCycleEnd: string;

    /** Grace period end date (set when wallet balance is insufficient) */
    gracePeriodEnd?: string;

    /** Last successful payment timestamp */
    lastPaymentAt?: string;

    /** Last failed payment timestamp */
    lastPaymentFailedAt?: string;

    /** Email for billing notifications */
    billingEmail?: string;

    // ============================================================================
    // BILLING CYCLE LOCKING (Production Hardening)
    // ============================================================================

    /** Whether current billing cycle is locked (no new usage writes) */
    isBillingCycleLocked?: boolean;

    /** When the cycle was locked */
    billingCycleLockedAt?: string;
};

/**
 * BillingInvoice - Enhanced invoice with wallet deduction tracking
 * 
 * CRITICAL: Invoice is persisted BEFORE deducting from wallet.
 * WHY: Ensures we never lose track of what was billed.
 */
export type BillingInvoice = Models.Document & {
    /** Human-readable invoice ID (e.g., INV-2026-001) */
    invoiceId: string;

    /** Reference to BillingAccount */
    billingAccountId: string;

    /** Billing entity ID (userId or organizationId) */
    billingEntityId: string;

    /** Billing entity type */
    billingEntityType: "user" | "organization";

    /** Billing cycle start (ISO datetime) */
    cycleStart: string;

    /** Billing cycle end (ISO datetime) */
    cycleEnd: string;

    /** Usage breakdown (JSON stringified) */
    usageBreakdown: string;

    /** Total amount in smallest currency unit (paisa/cents) */
    amount: number;

    /** Currency code (INR, USD, etc.) */
    currency: string;

    /** Invoice status */
    status: InvoiceStatus;

    /** Due date (ISO datetime) */
    dueDate: string;

    /** Razorpay Payment ID (for top-up payments) */
    razorpayPaymentId?: string;

    /** Wallet Transaction ID (when paid via wallet) */
    walletTransactionId?: string;

    /** Failure reason (when deduction fails) */
    failureReason?: string;

    /** Number of deduction retry attempts */
    retryCount: number;

    /** Timestamp when paid */
    paidAt?: string;
};

/**
 * UsageBreakdown - Detailed usage for invoice
 * 
 * This is stored as JSON in BillingInvoice.usageBreakdown
 */
export type UsageBreakdown = {
    /** Traffic usage in GB */
    trafficGB: number;

    /** Average storage usage in GB */
    storageAvgGB: number;

    /** Compute units consumed */
    computeUnits: number;

    /** Usage breakdown by module */
    byModule: {
        traffic?: number;
        storage?: number;
        docs?: number;
        github?: number;
        ai?: number;
        compute?: number;
    };

    /** Cost breakdown */
    costs: {
        traffic: number;
        storage: number;
        compute: number;
        total: number;
    };
};

/**
 * BillingAuditLog - Audit trail for billing events
 * 
 * CRITICAL: All billing events must be logged.
 * WHY: Compliance, debugging, customer support.
 */
export type BillingAuditLog = Models.Document & {
    /** Reference to BillingAccount */
    billingAccountId: string;

    /** Event type */
    eventType: BillingAuditEventType;

    /** Event-specific metadata (JSON stringified) */
    metadata?: string;

    /** User who triggered the event (if applicable) */
    actorUserId?: string;

    /** Razorpay event ID (for webhook events) */
    razorpayEventId?: string;

    /** Invoice ID (if event relates to an invoice) */
    invoiceId?: string;

    /** IP address (for security audit) */
    ipAddress?: string;
};

// ===============================
// DTO Types for API
// ===============================

/**
 * SetupBillingDto - Create billing account (wallet-only)
 */
export type SetupBillingDto = {
    /** Account type */
    type: BillingAccountType;

    /** User ID (for PERSONAL) */
    userId?: string;

    /** Organization ID (for ORG) */
    organizationId?: string;

    /** Email for billing notifications */
    billingEmail: string;

    /** Contact name */
    contactName: string;

    /** Contact phone (optional) */
    contactPhone?: string;
};

// ===============================
// Response Types
// ===============================

/**
 * BillingAccountResponse - API response for billing account
 */
export type BillingAccountResponse = {
    account: BillingAccount;
    walletBalance: number;
    nextBillingDate: string;
    estimatedAmount: number;
    currency: string;
    daysUntilSuspension?: number;
};

/**
 * RazorpayCheckoutOptions - Options for frontend Razorpay Checkout (one-time top-up)
 */
export type RazorpayCheckoutOptions = {
    key: string;
    orderId: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    prefill: {
        name: string;
        email: string;
        contact?: string;
    };
    theme: {
        color: string;
    };
};

// ===============================
// Webhook Types
// ===============================

/**
 * RazorpayWebhookEvent - Structure of Razorpay webhook payload
 */
export type RazorpayWebhookEvent = {
    entity: "event";
    account_id: string;
    event: string;
    contains: string[];
    payload: {
        payment?: {
            entity: RazorpayPaymentEntity;
        };
        refund?: {
            entity: RazorpayRefundEntity;
        };
    };
    created_at: number;
};

export type RazorpayPaymentEntity = {
    id: string;
    entity: "payment";
    amount: number;
    currency: string;
    status: "captured" | "failed" | "authorized";
    method: string;
    order_id?: string;
    card?: {
        last4: string;
        network: string;
    };
    error_code?: string;
    error_description?: string;
    notes?: Record<string, string>;
    created_at: number;
};

export type RazorpayRefundEntity = {
    id: string;
    entity: "refund";
    amount: number;
    currency: string;
    payment_id: string;
    status: "processed" | "failed" | "pending";
    speed_requested: "normal" | "optimum";
    speed_processed: "normal" | "instant";
    notes?: Record<string, string>;
    created_at: number;
};

// ===============================
// Constants
// ===============================

/** Grace period duration in days */
export const GRACE_PERIOD_DAYS = 14;

/** Reminder email schedule (days after insufficient balance) */
export const REMINDER_SCHEDULE_DAYS = [1, 7, 13];

/** Supported currencies */
export const SUPPORTED_CURRENCIES = ["INR", "USD"] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];
