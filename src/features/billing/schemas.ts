import { z } from "zod";
import { BillingStatus, BillingAccountType, InvoiceStatus } from "./types";

// ===============================
// Enum Schemas
// ===============================

export const billingStatusSchema = z.nativeEnum(BillingStatus);
export const billingAccountTypeSchema = z.nativeEnum(BillingAccountType);
export const invoiceStatusSchema = z.nativeEnum(InvoiceStatus);

// ===============================
// Billing Account Schemas
// ===============================

/**
 * Schema for setting up billing (creating BillingAccount)
 */
export const setupBillingSchema = z.object({
    type: billingAccountTypeSchema,
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    billingEmail: z.string().email(),
    contactName: z.string().min(1).max(255),
    contactPhone: z.string().optional(),
}).refine(
    (data) => {
        // PERSONAL requires userId, ORG requires organizationId
        if (data.type === BillingAccountType.PERSONAL) {
            return !!data.userId;
        }
        if (data.type === BillingAccountType.ORG) {
            return !!data.organizationId;
        }
        return false;
    },
    {
        message: "PERSONAL accounts require userId, ORG accounts require organizationId",
    }
);

/**
 * Schema for getting billing account
 */
export const getBillingAccountSchema = z.object({
    userId: z.string().optional(),
    organizationId: z.string().optional(),
}).refine(
    (data) => data.userId || data.organizationId,
    { message: "Either userId or organizationId is required" }
);

/**
 * Payment method types for mandate authorization
 * Maps directly to Razorpay's authType parameter
 * NOTE: Razorpay uses 'debitcard' not 'card' for recurring mandates
 */
export const paymentMethodSchema = z.enum(["upi", "debitcard", "netbanking"]);

/**
 * Schema for getting checkout options (mandate authorization)
 * Phone is REQUIRED for recurring payments (Razorpay requirement)
 */
export const checkoutOptionsSchema = z.object({
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    phone: z.string().min(10, "Phone number must be at least 10 digits").regex(
        /^[+]?[0-9]{10,15}$/,
        "Invalid phone number format"
    ),
    /** Optional: Force specific payment method (upi, card, netbanking). If not specified, Razorpay shows all options. */
    paymentMethod: paymentMethodSchema.optional(),
}).refine(
    (data) => data.userId || data.organizationId,
    { message: "Either userId or organizationId is required" }
);

/**
 * Schema for updating billing account
 */
export const updateBillingAccountSchema = z.object({
    billingEmail: z.string().email().optional(),
    billingStatus: billingStatusSchema.optional(),
});

// ===============================
// Payment Method Schemas
// ===============================

/**
 * Schema for updating payment method after Razorpay checkout
 */
export const updatePaymentMethodSchema = z.object({
    razorpayPaymentId: z.string().min(1),
    razorpaySubscriptionId: z.string().optional(),
    razorpaySignature: z.string().min(1),
});

/**
 * Schema for creating Razorpay checkout session
 */
export const createCheckoutSessionSchema = z.object({
    billingAccountId: z.string().min(1),
    returnUrl: z.string().url().optional(),
});

// ===============================
// Invoice Schemas
// ===============================

/**
 * Schema for getting invoices
 */
export const getInvoicesSchema = z.object({
    billingAccountId: z.string().optional(),
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    status: invoiceStatusSchema.optional(),
    limit: z.coerce.number().min(1).max(100).default(24),
    offset: z.coerce.number().min(0).default(0),
}).refine(
    (data) => data.billingAccountId || data.userId || data.organizationId,
    { message: "billingAccountId, userId, or organizationId is required" }
);

/**
 * Schema for getting a single invoice
 */
export const getInvoiceSchema = z.object({
    invoiceId: z.string().min(1),
});

/**
 * Schema for retrying payment on a failed invoice
 */
export const retryPaymentSchema = z.object({
    invoiceId: z.string().min(1),
});

// ===============================
// Webhook Schemas
// ===============================

/**
 * Schema for Razorpay webhook header validation
 */
export const webhookHeadersSchema = z.object({
    "x-razorpay-signature": z.string().min(1),
});

/**
 * Schema for Razorpay webhook event
 */
export const webhookEventSchema = z.object({
    entity: z.literal("event"),
    account_id: z.string(),
    event: z.string(),
    contains: z.array(z.string()),
    payload: z.object({
        payment: z.object({
            entity: z.object({
                id: z.string(),
                amount: z.number(),
                currency: z.string(),
                status: z.enum(["captured", "failed", "authorized"]),
                method: z.string(),
                notes: z.record(z.string()).optional(),
            }),
        }).optional(),
        subscription: z.object({
            entity: z.object({
                id: z.string(),
                status: z.enum(["created", "authenticated", "active", "paused", "halted", "cancelled", "completed"]),
            }),
        }).optional(),
    }),
    created_at: z.number(),
});

// ===============================
// Billing Status Schemas
// ===============================

/**
 * Schema for checking billing status
 */
export const checkBillingStatusSchema = z.object({
    userId: z.string().optional(),
    organizationId: z.string().optional(),
}).refine(
    (data) => data.userId || data.organizationId,
    { message: "Either userId or organizationId is required" }
);

// ===============================
// Admin/Internal Schemas
// ===============================

/**
 * Schema for generating invoice (internal use)
 */
export const generateInvoiceSchema = z.object({
    billingAccountId: z.string().min(1),
    cycleStart: z.string().datetime(),
    cycleEnd: z.string().datetime(),
    forceRegenerate: z.boolean().default(false),
});

/**
 * Schema for processing billing cycle (cron job)
 */
export const processBillingCycleSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dryRun: z.boolean().default(false),
});

/**
 * Schema for suspending account (internal use)
 */
export const suspendAccountSchema = z.object({
    billingAccountId: z.string().min(1),
    reason: z.string().optional(),
});

/**
 * Schema for restoring account (internal use)
 */
export const restoreAccountSchema = z.object({
    billingAccountId: z.string().min(1),
    invoiceId: z.string().min(1),
});

// ===============================
// Export Types
// ===============================

export type SetupBillingInput = z.infer<typeof setupBillingSchema>;
export type GetBillingAccountInput = z.infer<typeof getBillingAccountSchema>;
export type UpdateBillingAccountInput = z.infer<typeof updateBillingAccountSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type GetInvoicesInput = z.infer<typeof getInvoicesSchema>;
export type RetryPaymentInput = z.infer<typeof retryPaymentSchema>;
export type WebhookEventInput = z.infer<typeof webhookEventSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type ProcessBillingCycleInput = z.infer<typeof processBillingCycleSchema>;
