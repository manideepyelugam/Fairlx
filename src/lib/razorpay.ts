import "server-only";

import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Razorpay Client Utility
 * 
 * Provides initialized Razorpay instance and helper functions
 * for payment operations, subscription management, and webhook verification.
 * 
 * SECURITY:
 * - API keys loaded from environment variables
 * - Webhook signatures verified with HMAC-SHA256
 * - All sensitive operations are server-side only
 */

// ===============================
// Razorpay Instance
// ===============================

let razorpayInstance: Razorpay | null = null;

/**
 * Get Razorpay instance (singleton pattern)
 * 
 * WHY singleton: Avoids creating multiple instances,
 * which could cause rate limiting issues.
 */
export function getRazorpay(): Razorpay {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error(
                "[Razorpay] Missing API keys. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
            );
        }

        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }

    return razorpayInstance;
}

// ===============================
// Webhook Verification
// ===============================

/**
 * Verify Razorpay webhook signature
 * 
 * CRITICAL: Always verify webhooks before processing.
 * Never trust unverified webhook payloads.
 * 
 * @param body - Raw request body (string)
 * @param signature - X-Razorpay-Signature header value
 * @param secret - Webhook secret from Razorpay dashboard
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
    body: string,
    signature: string,
    secret?: string
): boolean {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("[Razorpay] Webhook secret not configured");
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error("[Razorpay] Signature verification failed:", error);
        return false;
    }
}

/**
 * Verify Razorpay payment signature (for checkout flow)
 * 
 * Used to verify payment after Razorpay Checkout completes.
 * 
 * @param orderId - Razorpay Order ID
 * @param paymentId - Razorpay Payment ID
 * @param signature - Signature from checkout response
 * @returns true if signature is valid
 */
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        console.error("[Razorpay] API key secret not configured");
        return false;
    }

    try {
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error("[Razorpay] Payment signature verification failed:", error);
        return false;
    }
}

/**
 * Verify Razorpay subscription signature
 * 
 * Used to verify subscription after Razorpay Checkout completes.
 * 
 * @param subscriptionId - Razorpay Subscription ID
 * @param paymentId - Razorpay Payment ID
 * @param signature - Signature from checkout response
 * @returns true if signature is valid
 */
export function verifySubscriptionSignature(
    subscriptionId: string,
    paymentId: string,
    signature: string
): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        console.error("[Razorpay] API key secret not configured");
        return false;
    }

    try {
        const body = paymentId + "|" + subscriptionId;
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error("[Razorpay] Subscription signature verification failed:", error);
        return false;
    }
}

// ===============================
// Customer Operations
// ===============================

export interface CreateCustomerOptions {
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, string>;
}

/**
 * Create a Razorpay customer
 */
export async function createCustomer(options: CreateCustomerOptions) {
    const razorpay = getRazorpay();

    try {
        return await razorpay.customers.create({
            name: options.name,
            email: options.email,
            contact: options.contact,
            notes: options.notes,
            fail_existing: 0, // Should return existing, but sometimes throws
        });
    } catch (error: unknown) {
        // Check if customer already exists error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiError = error as any; // Razorpay error structure is custom
        if (apiError.error?.description === "Customer already exists for the merchant" ||
            apiError.error?.code === "BAD_REQUEST_ERROR") {

            console.log(`[Razorpay] Customer exists, fetching by email: ${options.email}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customers: any = await razorpay.customers.all({
                email: options.email,
                count: 1,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            if (customers.items && customers.items.length > 0) {
                return customers.items[0];
            }
        }
        throw error;
    }
}

/**
 * Get a Razorpay customer by ID
 */
export async function getCustomer(customerId: string) {
    const razorpay = getRazorpay();
    return razorpay.customers.fetch(customerId);
}

// ===============================
// Subscription Operations
// ===============================

export interface CreateSubscriptionOptions {
    planId: string;
    customerId: string;
    totalCount?: number;
    notes?: Record<string, string>;
    notifyInfo?: {
        notify_email?: string;
        notify_phone?: string;
    };
}

/**
 * Create a Razorpay subscription
 * 
 * For usage-based billing, we create a subscription with
 * add-ons added at billing cycle end.
 */
export async function createSubscription(options: CreateSubscriptionOptions) {
    const razorpay = getRazorpay();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return razorpay.subscriptions.create({
        plan_id: options.planId,
        customer_id: options.customerId,
        total_count: options.totalCount || 120, // 10 years of monthly billing
        customer_notify: 1,
        notes: options.notes,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

/**
 * Get a Razorpay subscription by ID
 */
export async function getSubscription(subscriptionId: string) {
    const razorpay = getRazorpay();
    return razorpay.subscriptions.fetch(subscriptionId);
}

/**
 * Cancel a Razorpay subscription
 */
export async function cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = true
) {
    const razorpay = getRazorpay();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd as any);
}

// ===============================
// Invoice/Order Operations
// ===============================

export interface CreateOrderOptions {
    amount: number; // Amount in smallest currency unit
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
}

/**
 * Create a Razorpay order for one-time payment
 */
export async function createOrder(options: CreateOrderOptions) {
    const razorpay = getRazorpay();

    return razorpay.orders.create({
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        notes: options.notes,
    });
}

/**
 * Get a Razorpay payment by ID
 */
export async function getPayment(paymentId: string) {
    const razorpay = getRazorpay();
    return razorpay.payments.fetch(paymentId);
}

/**
 * Capture an authorized payment
 */
export async function capturePayment(
    paymentId: string,
    amount: number,
    currency: string
) {
    const razorpay = getRazorpay();
    return razorpay.payments.capture(paymentId, amount, currency);
}

// ===============================
// Plan Operations (for base subscription)
// ===============================

/**
 * Get or create the base billing plan
 * 
 * We use a Rs.0 base plan and add usage charges as add-ons.
 */
export async function getOrCreateBasePlan() {
    const razorpay = getRazorpay();
    const planId = process.env.RAZORPAY_BASE_PLAN_ID;

    if (planId) {
        try {
            return await razorpay.plans.fetch(planId);
        } catch {
            // Plan doesn't exist, create it
        }
    }

    // Create a base plan with Rs.0 (usage-based)
    return razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
            name: "Fairlx Usage-Based Billing",
            amount: 100, // 1 INR base fee (Razorpay requires >= 1 INR)
            currency: "INR",
            description: "Monthly usage-based billing for Fairlx",
        },
    });
}

// ===============================
// Utility Functions
// ===============================

/**
 * Get Razorpay public key for frontend
 */
export function getPublicKey(): string {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
        throw new Error("[Razorpay] RAZORPAY_KEY_ID not configured");
    }
    return keyId;
}

/**
 * Format amount for Razorpay (convert to paisa/cents)
 */
export function formatAmount(amount: number): number {
    // Razorpay expects amount in smallest currency unit
    // INR: paisa (multiply by 100)
    // USD: cents (multiply by 100)
    return Math.round(amount * 100);
}

/**
 * Parse amount from Razorpay (convert from paisa/cents)
 */
export function parseAmount(amount: number): number {
    return amount / 100;
}
