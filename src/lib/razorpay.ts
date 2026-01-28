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
 * 
 * NOTE: contact is REQUIRED for recurring payments (e-Mandate).
 * This function ensures the customer has a contact before mandate setup.
 */
export async function updateCustomer(
    customerId: string,
    updates: { contact?: string; name?: string; email?: string }
) {
    const razorpay = getRazorpay();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (razorpay.customers as any).edit(customerId, updates);
}

/**
 * Ensure customer has contact (required for recurring payments)
 */
export async function ensureCustomerContact(
    customerId: string,
    contact: string
): Promise<void> {
    if (!contact) {
        throw new Error("Phone number is required for recurring payments");
    }

    try {
        const customer = await getCustomer(customerId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(customer as any).contact) {
            await updateCustomer(customerId, { contact });
        }
    } catch (error) {
        throw error;
    }
}

// ===============================
// E-Mandate Operations (RBI-Compliant Postpaid Billing)
// ===============================

/**
 * E-MANDATE BILLING FLOW:
 * 
 * 1. Customer authorizes e-Mandate (no charge)
 * 2. We aggregate usage at cycle end
 * 3. We generate invoice BEFORE charging
 * 4. We debit the invoice amount using the mandate
 * 
 * This is RBI-compliant postpaid billing.
 */

export interface CreateMandateOrderOptions {
    customerId: string;
    maxAmount: number; // Maximum debit amount in paise
    authType?: "netbanking" | "debitcard" | "emandate" | "upi";
    tokenNotes?: Record<string, string>;
    receiptPrefix?: string;
}

/**
 * Create an order for e-Mandate authorization
 * 
 * This creates a ₹1 authorization order that registers the customer's
 * payment method for future auto-debits up to maxAmount.
 * 
 * NOTE: Razorpay requires minimum ₹1 (100 paise) for orders.
 * This ₹1 is authorized but NOT captured - it's released automatically.
 * 
 * FEATURE FLAG: When ENABLE_EMANDATE is false, this function throws for
 * emandate/netbanking authTypes but allows UPI and debitcard.
 */
export async function createMandateAuthorizationOrder(options: CreateMandateOrderOptions) {
    // Import feature flag (dynamic to avoid circular dependency)
    const { ENABLE_EMANDATE } = await import("@/config");

    // FEATURE FLAG: Block eMandate/netbanking authorization when disabled
    // UPI AutoPay and debit cards can still create recurring tokens
    if (!ENABLE_EMANDATE && (options.authType === "emandate" || options.authType === "netbanking")) {
        throw new Error(
            "eMandate is temporarily disabled pending company incorporation. " +
            "Please use UPI AutoPay or Card payment instead."
        );
    }

    const razorpay = getRazorpay();

    const receipt = `${options.receiptPrefix || "mandate"}_${Date.now()}`;

    // Create order with recurring payment token
    // Razorpay requires:
    // 1. Minimum amount of 100 paise (₹1)
    // 2. customer_id when using token field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return razorpay.orders.create({
        amount: 100, // ₹1 minimum (in paise) - auth only, not captured
        currency: "INR",
        receipt,
        payment_capture: false, // Don't capture - this is auth only
        customer_id: options.customerId, // REQUIRED when using token field
        notes: options.tokenNotes,
        // Token configuration for recurring payments
        token: {
            max_amount: options.maxAmount,
            expire_at: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60), // 10 years
            frequency: "as_presented", // Charge as needed (usage-based)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
}

export interface CreateRecurringPaymentOptions {
    customerId: string;
    tokenId: string; // Saved mandate token from authorization
    amount: number; // Amount in paise
    invoiceId: string;
    description: string;
    notes?: Record<string, string>;
}

/**
 * Create a recurring payment using saved mandate
 * 
 * CRITICAL: This is called AFTER invoice is generated.
 * The invoice must exist before we attempt to charge.
 */
export async function createRecurringPayment(options: CreateRecurringPaymentOptions) {
    const razorpay = getRazorpay();

    const receipt = `inv_${options.invoiceId}_${Date.now()}`;

    // Create order for the recurring payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await razorpay.orders.create({
        amount: options.amount,
        currency: "INR",
        receipt,
        notes: {
            ...options.notes,
            fairlx_invoice_id: options.invoiceId,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Create payment using the saved token (mandate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment = await (razorpay.payments as any).createRecurringPayment({
        email: "", // Will be fetched from customer
        contact: "",
        amount: options.amount,
        currency: "INR",
        order_id: order.id,
        customer_id: options.customerId,
        token: options.tokenId,
        recurring: "1",
        description: options.description,
        notes: {
            fairlx_invoice_id: options.invoiceId,
        },
    });

    return { order, payment };
}

/**
 * Get all saved tokens (mandates) for a customer
 */
export async function getCustomerTokens(customerId: string) {
    const razorpay = getRazorpay();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (razorpay.customers as any).fetchTokens(customerId);
}

/**
 * Get a specific token by ID
 */
export async function getToken(customerId: string, tokenId: string) {
    const razorpay = getRazorpay();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (razorpay.customers as any).fetchToken(customerId, tokenId);
}

/**
 * Delete (revoke) a saved token/mandate
 */
export async function deleteToken(customerId: string, tokenId: string) {
    const razorpay = getRazorpay();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (razorpay.customers as any).deleteToken(customerId, tokenId);
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
