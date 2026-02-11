import "server-only";

import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Razorpay Client Utility
 * 
 * Provides initialized Razorpay instance and helper functions
 * for one-time payment operations and webhook verification.
 * 
 * WALLET-ONLY: This module handles Razorpay interactions for
 * wallet top-ups only. No mandates, subscriptions, or recurring payments.
 * 
 * SECURITY:
 * - API keys loaded from environment variables
 * - Webhook signatures verified with HMAC-SHA256
 * - Payment signatures verified after checkout
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
    } catch {
        return false;
    }
}

/**
 * Verify Razorpay payment signature (for checkout flow)
 * 
 * Used to verify payment after Razorpay Checkout completes.
 * This confirms the payment is authentic before crediting the wallet.
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
    } catch {
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

            // Customer exists, fetch by email
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

/**
 * Update a Razorpay customer
 */
export async function updateCustomer(
    customerId: string,
    updates: { contact?: string; name?: string; email?: string }
) {
    const razorpay = getRazorpay();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (razorpay.customers as any).edit(customerId, updates);
}

// ===============================
// Order Operations (for wallet top-ups)
// ===============================

export interface CreateOrderOptions {
    amount: number; // Amount in smallest currency unit (paise)
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
}

/**
 * Create a Razorpay order for one-time wallet top-up
 * 
 * This creates an order that the frontend opens via Razorpay Checkout.
 * The payment is captured automatically (payment_capture: true by default).
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
