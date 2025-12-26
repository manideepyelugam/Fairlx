"use client";

import { useCallback, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * PRODUCTION POLISH: Safe Global Refresh with Throttling
 * 
 * WHY REFRESH DOES NOT RELOAD THE PAGE:
 * - Preserves user context (filters, scroll position, open modals)
 * - Only invalidates React Query cache to trigger refetch
 * - Faster than full page reload
 * - Better UX for slow connections
 * 
 * THROTTLING STRATEGY:
 * - Prevents multiple refreshes within 2-second window
 * - Batches core queries first (auth, workspace, permissions)
 * - Defers heavy queries (billing, analytics) by 500ms
 * - This reduces perceived lag on slow networks
 * 
 * ACCESS LOSS DETECTION:
 * - If 401/403 detected after refresh, redirect gracefully
 * - Shows friendly "Your access has changed" message
 * - Prevents raw error screens for expected permission changes
 */

const THROTTLE_MS = 2000; // Minimum time between refreshes
const DEFER_HEAVY_QUERIES_MS = 500; // Delay for billing/analytics queries

export const useAppRefresh = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const lastRefreshRef = useRef<number>(0);

    const refresh = useCallback(async () => {
        // Guard: Prevent refresh while already refreshing
        if (isRefreshing) return;

        // Guard: Throttle - prevent rapid consecutive refreshes
        const now = Date.now();
        if (now - lastRefreshRef.current < THROTTLE_MS) {
            console.log("[Refresh] Throttled - too soon since last refresh");
            return;
        }

        lastRefreshRef.current = now;
        setIsRefreshing(true);

        try {
            // BATCH 1: Core queries (immediate)
            // These are essential for app functionality
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["current"] }),
                queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
                queryClient.invalidateQueries({ queryKey: ["organizations"] }),
                queryClient.invalidateQueries({ queryKey: ["members"] }),
            ]);

            // BATCH 2: Heavy queries (deferred)
            // Billing and analytics can wait slightly
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["usage"] });
                queryClient.invalidateQueries({ queryKey: ["billing"] });
                queryClient.invalidateQueries({ queryKey: ["analytics"] });
                queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
            }, DEFER_HEAVY_QUERIES_MS);

        } catch (error) {
            // ACCESS LOSS DETECTION
            // If refresh fails with auth error, handle gracefully
            const err = error as { status?: number; code?: number };

            if (err.status === 401 || err.code === 401) {
                toast.info("Your session has expired", {
                    description: "Please sign in again to continue.",
                });
                router.push("/sign-in");
                return;
            }

            if (err.status === 403 || err.code === 403) {
                toast.info("Your access has changed", {
                    description: "You may no longer have access to this resource.",
                });
                router.push("/");
                return;
            }

            // For other errors, log but don't crash
            console.error("[Refresh] Error during refresh:", error);
        } finally {
            // Ensure UI shows refresh state briefly
            setTimeout(() => {
                setIsRefreshing(false);
            }, 500);
        }
    }, [queryClient, router, isRefreshing]);

    return {
        refresh,
        isRefreshing,
    };
};

/**
 * Hook for screen-level refresh (specific query keys)
 * 
 * Use this when you only need to refresh specific data,
 * not the entire app state.
 */
export const useScreenRefresh = (queryKeys: string[]) => {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);

        try {
            await Promise.all(
                queryKeys.map((key) =>
                    queryClient.invalidateQueries({ queryKey: [key] })
                )
            );
        } finally {
            setTimeout(() => {
                setIsRefreshing(false);
            }, 500);
        }
    }, [queryClient, queryKeys, isRefreshing]);

    return {
        refresh,
        isRefreshing,
    };
};
