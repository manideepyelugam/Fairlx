"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook for refreshing app data without full page reload
 * 
 * Refreshes:
 * - Active workspace
 * - Organizations
 * - Current user
 * - Permissions (via cache invalidation)
 * 
 * Rules:
 * - Refresh is blocked while already refreshing
 * - Does NOT reset filters, tabs, or scroll position
 * - Does NOT reload the page
 */
export const useAppRefresh = () => {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);

        try {
            // Invalidate all relevant queries to trigger refetch
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["current"] }),
                queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
                queryClient.invalidateQueries({ queryKey: ["organizations"] }),
                queryClient.invalidateQueries({ queryKey: ["members"] }),
                // Add more query keys as needed
            ]);
        } finally {
            // Small delay to ensure UI shows refresh state
            setTimeout(() => {
                setIsRefreshing(false);
            }, 500);
        }
    }, [queryClient, isRefreshing]);

    return {
        refresh,
        isRefreshing,
    };
};

/**
 * Hook for screen-level refresh (specific query keys)
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
