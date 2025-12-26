"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrent } from "@/features/auth/api/use-current";
import { useAccountType } from "@/features/organizations/hooks/use-account-type";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useGetOrganizations } from "@/features/organizations/api/use-get-organizations";

/**
 * Global App Readiness Provider
 * 
 * The app is considered READY only when ALL are resolved:
 * - Auth verified
 * - User profile loaded
 * - Account type resolved
 * - Active organization resolved (if ORG)
 * - Active workspace resolved
 * - ORG onboarding completed (if ORG account)
 * 
 * Until isAppReady === true:
 * - Render ONLY a full-screen loader
 * - Do NOT render navbar, sidebar, or content partially
 */

interface AppReadinessContextValue {
    isAppReady: boolean;
    isTimedOut: boolean;
    loadingMessage: string;
    retry: () => void;
}

const AppReadinessContext = createContext<AppReadinessContextValue | undefined>(undefined);

const TIMEOUT_MS = 15000; // 15 seconds

export const useAppReadiness = () => {
    const context = useContext(AppReadinessContext);
    if (!context) {
        throw new Error("useAppReadiness must be used within AppReadinessProvider");
    }
    return context;
};

interface AppReadinessProviderProps {
    children: React.ReactNode;
}

export const AppReadinessProvider = ({ children }: AppReadinessProviderProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isTimedOut, setIsTimedOut] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Core data hooks
    const { data: user, isLoading: isUserLoading, refetch: refetchUser } = useCurrent();
    const { isLoading: isAccountTypeLoading, isOrg } = useAccountType();
    const { isLoading: isWorkspacesLoading, refetch: refetchWorkspaces } = useGetWorkspaces();
    const { isLoading: isOrgsLoading, refetch: refetchOrgs } = useGetOrganizations();

    // Calculate overall loading state
    const isLoading = isUserLoading || isAccountTypeLoading || isWorkspacesLoading || (isOrg && isOrgsLoading);

    // Check if ORG onboarding is complete
    const prefs = user?.prefs || {};
    const orgSetupComplete = prefs.orgSetupComplete === true;
    const needsOrgOnboarding = isOrg && !orgSetupComplete;

    // App is ready when user exists, all data is loaded, and onboarding is complete
    const isAppReady = !isLoading && !!user && !isTimedOut && !needsOrgOnboarding;

    // Redirect to onboarding if needed
    useEffect(() => {
        if (!isLoading && user && needsOrgOnboarding && !pathname?.startsWith("/onboarding")) {
            router.push("/onboarding/organization");
        }
    }, [isLoading, user, needsOrgOnboarding, router, pathname]);

    // Determine loading message
    const getLoadingMessage = useCallback(() => {
        if (isUserLoading) return "Setting things up…";
        if (isAccountTypeLoading) return "Loading your profile…";
        if (isWorkspacesLoading) return "Loading your workspace…";
        if (isOrgsLoading && isOrg) return "Loading organization…";
        if (needsOrgOnboarding) return "Redirecting to setup…";
        return "Almost ready…";
    }, [isUserLoading, isAccountTypeLoading, isWorkspacesLoading, isOrgsLoading, isOrg, needsOrgOnboarding]);

    // Retry handler
    const retry = useCallback(() => {
        setIsTimedOut(false);
        setRetryCount((c) => c + 1);
        refetchUser();
        refetchWorkspaces();
        if (isOrg) {
            refetchOrgs();
        }
    }, [refetchUser, refetchWorkspaces, refetchOrgs, isOrg]);

    // Timeout handling
    useEffect(() => {
        if (isAppReady) {
            setIsTimedOut(false);
            return;
        }

        const timer = setTimeout(() => {
            if (!isAppReady) {
                setIsTimedOut(true);
            }
        }, TIMEOUT_MS);

        return () => clearTimeout(timer);
    }, [isAppReady, retryCount]);

    const value: AppReadinessContextValue = {
        isAppReady,
        isTimedOut,
        loadingMessage: getLoadingMessage(),
        retry,
    };

    return (
        <AppReadinessContext.Provider value={value}>
            {children}
        </AppReadinessContext.Provider>
    );
};
