"use client";

import { useState, useCallback } from "react";
import { CreditCard, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import { RazorpayCheckoutOptions } from "../types";

interface PaymentMethodSetupProps {
    checkoutOptions: RazorpayCheckoutOptions | null;
    isLoading?: boolean;
    onSuccess?: (paymentId: string, subscriptionId: string, signature: string) => void;
    onError?: (error: string) => void;
    estimatedNextBill?: number;
    nextBillingDate?: string;
    currency?: string;
    hasExistingMethod?: boolean;
    existingMethodInfo?: {
        type: string;
        last4?: string;
        brand?: string;
    };
}

// Extend Window for Razorpay
declare global {
    interface Window {
        Razorpay: new (options: RazorpayCheckoutConfig) => RazorpayCheckoutInstance;
    }
}

interface RazorpayCheckoutConfig {
    key: string;
    subscription_id?: string;
    order_id?: string;
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

interface RazorpayCheckoutInstance {
    open: () => void;
    close: () => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id?: string;
    razorpay_order_id?: string;
    razorpay_signature: string;
}

/**
 * Payment Method Setup Component
 * 
 * Integrates Razorpay Checkout for subscription/mandate creation.
 * Handles the complete payment method setup flow.
 * 
 * SECURITY:
 * - No card data is stored locally
 * - All payment handling done via Razorpay
 * - Signature verification on backend
 */
export function PaymentMethodSetup({
    checkoutOptions,
    isLoading,
    onSuccess,
    onError,
    estimatedNextBill,
    nextBillingDate,
    currency = "INR",
    hasExistingMethod,
    existingMethodInfo,
}: PaymentMethodSetupProps) {
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const formatAmount = useCallback((amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency,
            maximumFractionDigits: 0,
        }).format(amount);
    }, [currency]);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, []);

    const handleOpenCheckout = useCallback(() => {
        if (!checkoutOptions || !isScriptLoaded) {
            toast.error("Payment system not ready. Please refresh the page.");
            return;
        }

        setIsProcessing(true);

        const razorpayOptions: RazorpayCheckoutConfig = {
            key: checkoutOptions.key,
            subscription_id: checkoutOptions.subscriptionId,
            order_id: checkoutOptions.orderId,
            name: checkoutOptions.name,
            description: checkoutOptions.description,
            prefill: {
                name: checkoutOptions.prefill.name,
                email: checkoutOptions.prefill.email,
                contact: checkoutOptions.prefill.contact,
            },
            theme: {
                color: checkoutOptions.theme.color,
            },
            handler: (response: RazorpayResponse) => {
                setIsProcessing(false);
                if (onSuccess) {
                    onSuccess(
                        response.razorpay_payment_id,
                        response.razorpay_subscription_id || "",
                        response.razorpay_signature
                    );
                }
                toast.success("Payment method added successfully!");
            },
            modal: {
                ondismiss: () => {
                    setIsProcessing(false);
                },
            },
        };

        try {
            const razorpay = new window.Razorpay(razorpayOptions);
            razorpay.open();
        } catch (error) {
            setIsProcessing(false);
            const errorMessage = error instanceof Error ? error.message : "Failed to open payment dialog";
            if (onError) {
                onError(errorMessage);
            }
            toast.error(errorMessage);
        }
    }, [checkoutOptions, isScriptLoaded, onSuccess, onError]);

    return (
        <>
            {/* Load Razorpay Script */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setIsScriptLoaded(true)}
                onError={() => {
                    console.error("Failed to load Razorpay script");
                    toast.error("Failed to load payment system");
                }}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {hasExistingMethod ? "Update Payment Method" : "Add Payment Method"}
                    </CardTitle>
                    <CardDescription>
                        {hasExistingMethod
                            ? "Update your payment method for automatic billing"
                            : "Add a payment method to enable automatic monthly billing"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Auto-Debit Explanation */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>How auto-billing works:</strong> You will be charged automatically at the end of
                            each billing cycle based on your usage. Your payment method will be saved securely
                            by Razorpay – we never store your card details.
                        </AlertDescription>
                    </Alert>

                    {/* Existing Payment Method */}
                    {hasExistingMethod && existingMethodInfo && (
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        {existingMethodInfo.brand || existingMethodInfo.type}
                                        {existingMethodInfo.last4 && ` •••• ${existingMethodInfo.last4}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Current payment method</p>
                                </div>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                    )}

                    {/* Billing Preview */}
                    {(estimatedNextBill !== undefined || nextBillingDate) && (
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30">
                            {nextBillingDate && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Next billing date</p>
                                    <p className="font-medium">{formatDate(nextBillingDate)}</p>
                                </div>
                            )}
                            {estimatedNextBill !== undefined && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Estimated amount</p>
                                    <p className="font-medium">{formatAmount(estimatedNextBill)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error State */}
                    {!checkoutOptions && !isLoading && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Unable to load payment system. Please refresh the page or contact support.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Add Payment Method Button */}
                    <Button
                        onClick={handleOpenCheckout}
                        disabled={!checkoutOptions || !isScriptLoaded || isLoading || isProcessing}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading || isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isProcessing ? "Processing..." : "Loading..."}
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                {hasExistingMethod ? "Update Payment Method" : "Add Payment Method"}
                            </>
                        )}
                    </Button>

                    {/* Security Notice */}
                    <p className="text-xs text-center text-muted-foreground">
                        Payments are processed securely by Razorpay. Your card details are never stored on our servers.
                    </p>
                </CardContent>
            </Card>
        </>
    );
}
