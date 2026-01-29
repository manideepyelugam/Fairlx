"use client";

import React, { createContext, useContext, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useGetAccountLifecycle, LifecycleRouting } from "@/features/auth/api/use-account-lifecycle";
import { AccountLifecycleState } from "@/features/auth/types";

/**
 * Initial unresolved lifecycle state.
 */
const INITIAL_STATE: AccountLifecycleState = {
    isLoaded: false,
    isLoading: true,
    isAuthenticated: false,
    hasUser: false,
    isEmailVerified: false,
    hasOrg: false,
    hasWorkspace: false,
    user: null,
    accountType: null,
    activeMember: null,
    activeOrgId: null,
    activeOrgName: null,
    activeOrgImageUrl: null,
    activeWorkspaceId: null,
    mustResetPassword: false,
    orgRole: null,
};

const INITIAL_ROUTING: LifecycleRouting = {
    state: "UNAUTHENTICATED",
    redirectTo: "/sign-in",
    allowedPaths: [],
    blockedPaths: ["*"],
};

interface AccountLifecycleContextValue {
    /** The full lifecycle state */
    lifecycleState: AccountLifecycleState;
    /** Server-derived lifecycle routing (state, redirectTo, allowed/blocked paths) */
    lifecycleRouting: LifecycleRouting;
    /** Refresh lifecycle state from server */
    refreshLifecycle: () => Promise<void>;
    /** Derived: Is this a PERSONAL account? */
    isPersonal: boolean;
    /** Derived: Is this an ORG account? */
    isOrg: boolean;
    /** Derived: Is the user fully setup (has workspace)? */
    isFullySetup: boolean;
    /** Derived: Is state loaded? */
    isLoaded: boolean;
    /** 
     * Derived: Is this an ORG member without workspace (restricted mode)?
     * These users should NOT see Create Workspace, Manage Org CTAs.
     */
    isRestrictedOrgMember: boolean;
    /**
     * Derived: Can this user create workspaces?
     * - PERSONAL accounts: yes (up to their limit)
     * - ORG OWNER/ADMIN: yes
     * - ORG MEMBER/MODERATOR: NO
     */
    canCreateWorkspace: boolean;
    /**
     * Derived: Can this user manage auth providers (link Google/GitHub)?
     * - PERSONAL accounts: yes
     * - ORG OWNER/ADMIN: yes
     * - ORG MEMBER/MODERATOR: NO (managed by org)
     */
    canManageAuthProviders: boolean;
}

const AccountLifecycleContext = createContext<AccountLifecycleContextValue | null>(null);

interface AccountLifecycleProviderProps {
    children: React.ReactNode;
}

/**
 * AccountLifecycleProvider - The SINGLE source of truth for account lifecycle.
 * 
 * Wraps the application and provides:
 * - lifecycleState: Full account lifecycle state
 * - lifecycleRouting: Server-derived routing rules
 * - refreshLifecycle: Function to refresh state
 * - Derived helpers: isPersonal, isOrg, isFullySetup, isRestrictedOrgMember, canCreateWorkspace, canManageAuthProviders
 * 
 * All components should use useAccountLifecycle() to access lifecycle state.
 */
const PUBLIC_ROUTES = [
    "/sign-in",
    "/sign-up",
    "/verify-email",
    "/forgot-password",
    "/reset-password"
];

export function AccountLifecycleProvider({ children }: AccountLifecycleProviderProps) {
    const { lifecycleState, lifecycleRouting, refreshLifecycle, isLoaded } = useGetAccountLifecycle();
    const router = useRouter();
    const pathname = usePathname();

    const value = useMemo<AccountLifecycleContextValue>(() => {
        const state = lifecycleState ?? INITIAL_STATE;
        const routing = lifecycleRouting ?? INITIAL_ROUTING;
        const isOrg = state.accountType === "ORG";
        const isPersonal = state.accountType === "PERSONAL";
        const isOwner = state.orgRole === "OWNER";

        // SECURITY: Only OWNER has implicit org-level permissions
        // ADMIN/MODERATOR/MEMBER must use department-based permissions
        // (checked via useUserAccess hook, not here)

        // Workspace creation: PERSONAL or ORG OWNER only
        // Non-owner org members need WORKSPACE_CREATE permission from departments
        const canCreateWorkspace = isPersonal || isOwner;

        // Auth provider linking: PERSONAL or ORG OWNER only
        // Non-owner org members cannot link - managed by organization
        const canManageAuthProviders = isPersonal || isOwner;

        return {
            lifecycleState: state,
            lifecycleRouting: routing,
            refreshLifecycle,
            isPersonal,
            isOrg,
            isFullySetup: state.hasWorkspace ?? false,
            isLoaded,
            // Restricted mode: ORG + not OWNER + no workspace
            isRestrictedOrgMember: isOrg && !isOwner && !state.hasWorkspace,
            canCreateWorkspace,
            canManageAuthProviders,
        };
    }, [lifecycleState, lifecycleRouting, refreshLifecycle, isLoaded]);

    // Route Guards (Consolidated from AccountProvider)
    useEffect(() => {
        const state = value.lifecycleState;
        if (state.isLoading) return;

        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

        // 1. Unauthenticated User on Protected Route
        if (!state.isAuthenticated && !isPublicRoute) {
            // Let middleware handle this primarily, but client-side backup:
            // router.push("/sign-in");
            return;
        }

        // 2. Authenticated but Email NOT Verified
        if (state.isAuthenticated && !state.isEmailVerified && !isPublicRoute && pathname !== "/verify-email-sent") {
            // router.push("/verify-email-needed"); 
        }

        // 3. Authenticated Logic
        if (state.isAuthenticated && !isPublicRoute) {

            // Case A: No Account Type Selected -> Always Onboarding
            if (!state.accountType && !pathname.startsWith("/onboarding")) {
                router.push("/onboarding");
                return;
            }

            // Case B: ORG Account - Needs Org + Workspace
            if (state.accountType === "ORG") {
                // 1. Missing Org
                if (!state.hasOrg && !pathname.startsWith("/onboarding") && !pathname.startsWith("/invite") && !pathname.startsWith("/join")) {
                    router.push("/onboarding");
                    return;
                }

                // 2. Has Org but No Workspace
                if (state.hasOrg && !state.hasWorkspace) {
                    // Allowed routes: /welcome, /organization, /onboarding, /invite, /join
                    const allowedOnboardingPaths = ["/welcome", "/organization", "/onboarding", "/invite", "/join"];
                    const isAllowed = allowedOnboardingPaths.some(p => pathname.startsWith(p));
                    if (!isAllowed && pathname.startsWith("/workspaces")) {
                        router.push("/welcome");
                        return;
                    }
                }
            }

            // Case C: PERSONAL Account - Needs Workspace
            if (state.accountType === "PERSONAL") {
                if (!state.hasWorkspace && !pathname.startsWith("/onboarding")) {
                    router.push("/onboarding");
                    return;
                }
            }

            // Case D: Fully Setup - Block access to onboarding and welcome
            if (state.hasWorkspace) {
                if (pathname.startsWith("/onboarding") || pathname === "/welcome") {
                    // Redirect to active workspace or first one
                    if (state.activeWorkspaceId) {
                        router.push(`/workspaces/${state.activeWorkspaceId}`);
                    } else {
                        router.push("/");
                    }
                    return;
                }
            }
        }

    }, [pathname, value.lifecycleState, router]);

    return (
        <AccountLifecycleContext.Provider value={value}>
            {children}
        </AccountLifecycleContext.Provider>
    );
}

/**
 * Hook to access account lifecycle state.
 * 
 * This is the PRIMARY way to access lifecycle state in the app.
 * All components should use this instead of direct API calls.
 */
export function useAccountLifecycle() {
    const context = useContext(AccountLifecycleContext);
    if (!context) {
        throw new Error("useAccountLifecycle must be used within AccountLifecycleProvider");
    }
    return context;
}

// Legacy aliases for backward compatibility during migration
export { AccountLifecycleProvider as AccountProvider };
export const useAccount = () => {
    const { lifecycleState, refreshLifecycle } = useAccountLifecycle();
    return {
        state: lifecycleState,
        refreshState: refreshLifecycle,
    };
};
