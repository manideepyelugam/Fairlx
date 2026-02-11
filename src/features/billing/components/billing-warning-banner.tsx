"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BillingStatus } from "../types";

interface BillingWarningBannerProps {
    billingStatus: BillingStatus;
    daysUntilSuspension?: number;
    organizationId?: string;
    className?: string;
}

/**
 * Billing Warning Banner
 * 
 * Shows a persistent warning when billing status is DUE.
 * Displays countdown to suspension and links to billing page.
 * 
 * Can be dismissed, but returns next page load.
 */
export function BillingWarningBanner({
    billingStatus,
    daysUntilSuspension,
    organizationId,
    className,
}: BillingWarningBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    // Reset dismissed state when status changes
    useEffect(() => {
        setIsDismissed(false);
    }, [billingStatus]);

    // Only show for DUE status
    if (billingStatus !== BillingStatus.DUE || isDismissed) {
        return null;
    }

    const billingUrl = organizationId
        ? `/organization/settings/billing`
        : "/settings/billing";

    return (
        <Alert
            variant="destructive"
            className={`border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/30 ${className}`}
        >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
                Payment Required
            </AlertTitle>
            <AlertDescription className="text-amber-600/90 dark:text-amber-400/90">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p>
                        Your last payment failed.
                        {daysUntilSuspension !== undefined && (
                            <>
                                {" "}Your account will be suspended in{" "}
                                <strong>
                                    {daysUntilSuspension} {daysUntilSuspension === 1 ? "day" : "days"}
                                </strong>
                                .
                            </>
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
                            <Link href={billingUrl}>
                                Add Credits
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-amber-600"
                            onClick={() => setIsDismissed(true)}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Dismiss</span>
                        </Button>
                    </div>
                </div>
            </AlertDescription>
        </Alert>
    );
}
