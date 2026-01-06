
interface RazorpayCheckoutConfig {
    key: string;
    subscription_id?: string;
    order_id?: string;
    recurring?: boolean;
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
