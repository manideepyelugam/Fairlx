
interface RazorpayCheckoutConfig {
    key: string;
    subscription_id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    recurring?: boolean;
    /** Restrict checkout to specific payment method (upi, card, netbanking, wallet) */
    method?: "card" | "upi" | "netbanking" | "wallet";
    name: string;
    description: string;
    prefill: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme: {
        color: string;
    };
    handler: (response: RazorpayResponse) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id?: string;
    razorpay_order_id?: string;
    razorpay_signature: string;
}

interface RazorpayCheckoutInstance {
    open: () => void;
    close: () => void;
}

interface Window {
    Razorpay: new (options: RazorpayCheckoutConfig) => RazorpayCheckoutInstance;
}
