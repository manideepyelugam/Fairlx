
interface CashfreeCheckoutConfig {
    paymentSessionId: string;   // returned from createOrder API
    returnUrl?: string;         // optional redirect after payment
    redirectTarget?: "_modal" | "_self" | "_blank";
}

interface CashfreePaymentResponse {
    order_id: string;
    order_amount: number;
    payment_session_id: string;
    orderStatus: "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED";
    transaction?: {
        txStatus: "SUCCESS" | "FAILED" | "PENDING" | "CANCELLED" | "USER_DROPPED";
        txTime: string;
        txMsg: string;
        txId: string;
        referenceId: string;      // Cashfree payment ID (cfPaymentId)
        signature: string;        // For client-side signature verification
    };
}

interface CashfreeCheckoutInstance {
    checkout: (config: CashfreeCheckoutConfig) => Promise<CashfreePaymentResponse>;
}

interface Window {
    Cashfree: (config: { mode: "sandbox" | "production" }) => CashfreeCheckoutInstance;
}
