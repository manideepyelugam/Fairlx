"use client";

import { useEffect, useCallback } from "react";

import Cookies from "js-cookie";

import { useGetBillingStatus } from "../api/use-get-billing-status";
import { BillingStatus } from "../types";

const BILLING_STATUS_COOKIE = "fairlx-billing-status";
// Polling interval unused if hardcoded in query
// const BILLING_STATUS_POLL_INTERVAL = 1000 * 60 * 60; // 1 hourminute

interface BillingStatusTrackerProps {
    userId?: string;
    organizationId?: string;
    enabled?: boolean;
}

/**
 * Billing Status Tracker
 * 
 * This component:
 * 1. Polls the billing status API periodically
 * 2. Syncs the status to a cookie for middleware access
 * 3. Triggers UI updates when status changes
 * 
 * USAGE:
 * Add to your root layout or app component:
 * <BillingStatusTracker userId={user.$id} organizationId={org.$id} />
 */
export function BillingStatusTracker({
    userId,
    organizationId,
    enabled = true,
}: BillingStatusTrackerProps) {


    const { data: billingStatus } = useGetBillingStatus({
        userId,
        organizationId,
        enabled: enabled && (!!userId || !!organizationId),
    });

    // Sync billing status to cookie
    const syncStatusToCookie = useCallback((status: BillingStatus | undefined) => {
        if (status) {
            Cookies.set(BILLING_STATUS_COOKIE, status, {
                expires: 1, // 1 day
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
        } else {
            Cookies.remove(BILLING_STATUS_COOKIE);
        }
    }, []);

    // Watch for status changes
    useEffect(() => {
        if (billingStatus?.status) {
            syncStatusToCookie(billingStatus.status as BillingStatus);

            // If status changed to SUSPENDED, trigger a page reload to apply middleware redirect
            const previousStatus = Cookies.get(BILLING_STATUS_COOKIE);
            if (previousStatus !== billingStatus.status && billingStatus.status === BillingStatus.SUSPENDED) {
                // Small delay to ensure cookie is set
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        }
    }, [billingStatus?.status, syncStatusToCookie]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Don't remove cookie on unmount - it should persist
        };
    }, []);

    // Effect to intercept API responses and check for billing headers
    useEffect(() => {
        if (!enabled) return;

        // Listen for billing status headers in API responses
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);

            // Check for billing status headers
            const billingHeader = response.headers.get("X-Billing-Status");
            if (billingHeader) {
                syncStatusToCookie(billingHeader as BillingStatus);

                // If suspended, redirect to billing page
                if (billingHeader === BillingStatus.SUSPENDED) {
                    // Get current path
                    const currentPath = window.location.pathname;
                    const isBillingPath = [
                        "/organization/settings/billing",
                        "/settings/billing",
                        "/billing",
                    ].some(p => currentPath.startsWith(p));

                    if (!isBillingPath) {
                        const billingUrl = currentPath.startsWith("/organization")
                            ? "/organization/settings/billing"
                            : currentPath.startsWith("/workspaces/")
                                ? `${currentPath.split("/").slice(0, 3).join("/")}/billing`
                                : "/settings/billing";
                        window.location.href = billingUrl;
                    }
                }
            }

            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [enabled, syncStatusToCookie]);

    // This component doesn't render anything
    return null;
}

/**
 * Hook to get current billing status from cookie (synchronous)
 * Useful for immediate checks without waiting for API
 */
export function useBillingStatusCookie(): BillingStatus | null {
    if (typeof window === "undefined") return null;

    const status = Cookies.get(BILLING_STATUS_COOKIE);
    if (status && Object.values(BillingStatus).includes(status as BillingStatus)) {
        return status as BillingStatus;
    }
    return null;
}

/**
 * Clear billing status cookie (e.g., on logout)
 */
export function clearBillingStatusCookie(): void {
    Cookies.remove(BILLING_STATUS_COOKIE);
}
