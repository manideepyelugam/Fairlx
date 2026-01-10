"use client";

import { CheckCircle2, Clock, CreditCard, AlertTriangle, Ban } from "lucide-react";

export type BillingPhase = "usage" | "invoice" | "payment" | "grace" | "suspended";

interface BillingTimelineProps {
    currentPhase: BillingPhase;
    gracePeriodDays?: number;
}

const phases = [
    { id: "usage", label: "Usage Period", icon: Clock, description: "Tracking your usage" },
    { id: "invoice", label: "Invoice Generated", icon: CheckCircle2, description: "Bill calculated" },
    { id: "payment", label: "Auto-Debit", icon: CreditCard, description: "Payment attempted" },
    { id: "grace", label: "Grace Period", icon: AlertTriangle, description: "Payment due" },
    { id: "suspended", label: "Suspended", icon: Ban, description: "Access restricted" },
] as const;

/**
 * Billing Timeline Component
 * 
 * Visual representation of the billing cycle phases:
 * Usage Period → Invoice Generated → Auto-Debit → Grace Period → Suspended
 * 
 * Highlights the current phase and shows progress through the cycle.
 * Use this in billing pages to help users understand where they are.
 */
export function BillingTimeline({ currentPhase, gracePeriodDays = 14 }: BillingTimelineProps) {
    const currentIndex = phases.findIndex(p => p.id === currentPhase);

    return (
        <div className="w-full">
            {/* Desktop Timeline */}
            <div className="hidden md:flex items-center justify-between w-full max-w-3xl mx-auto">
                {phases.map((phase, index) => {
                    const isPast = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = phase.icon;

                    return (
                        <div key={phase.id} className="flex flex-col items-center flex-1">
                            <div className="relative flex items-center w-full">
                                {/* Connector line - left */}
                                {index > 0 && (
                                    <div
                                        className={`absolute left-0 right-1/2 h-0.5 top-4 -translate-x-1/2 ${isPast ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                    />
                                )}
                                {/* Connector line - right */}
                                {index < phases.length - 1 && (
                                    <div
                                        className={`absolute left-1/2 right-0 h-0.5 top-4 ${isPast ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                    />
                                )}

                                {/* Icon */}
                                <div
                                    className={`relative z-10 mx-auto rounded-full p-2 transition-all ${isPast
                                            ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                                            : isCurrent
                                                ? phase.id === "suspended"
                                                    ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 ring-2 ring-red-400"
                                                    : phase.id === "grace"
                                                        ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400 ring-2 ring-yellow-400"
                                                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 ring-2 ring-blue-400"
                                                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                            </div>

                            <span className={`mt-2 text-xs font-medium text-center ${isCurrent ? "text-foreground" : "text-muted-foreground"
                                }`}>
                                {phase.label}
                            </span>

                            {isCurrent && phase.id === "grace" && gracePeriodDays !== undefined && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                    {gracePeriodDays} days left
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile Timeline - Vertical */}
            <div className="md:hidden space-y-4">
                {phases.map((phase, index) => {
                    const isPast = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = phase.icon;

                    return (
                        <div key={phase.id} className="flex items-start gap-3">
                            <div className="relative flex flex-col items-center">
                                <div
                                    className={`rounded-full p-2 ${isPast
                                            ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                                            : isCurrent
                                                ? phase.id === "suspended"
                                                    ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 ring-2 ring-red-400"
                                                    : phase.id === "grace"
                                                        ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400 ring-2 ring-yellow-400"
                                                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 ring-2 ring-blue-400"
                                                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                {index < phases.length - 1 && (
                                    <div className={`w-0.5 h-8 ${isPast ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                                        }`} />
                                )}
                            </div>
                            <div className="pt-1">
                                <span className={`text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"
                                    }`}>
                                    {phase.label}
                                </span>
                                {isCurrent && phase.id === "grace" && gracePeriodDays !== undefined && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                        {gracePeriodDays} days remaining
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Get the current billing phase based on status
 */
export function getBillingPhaseFromStatus(
    status: string,
    hasInvoice?: boolean,
    paymentAttempted?: boolean
): BillingPhase {
    if (status === "SUSPENDED") return "suspended";
    if (status === "DUE") return "grace";
    if (paymentAttempted) return "payment";
    if (hasInvoice) return "invoice";
    return "usage";
}
