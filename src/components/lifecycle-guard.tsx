"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccountLifecycle } from "@/components/account-lifecycle-provider";
import { PUBLIC_ROUTES, ONBOARDING_ROUTES } from "@/features/auth/constants";
import { Loader2 } from "lucide-react";
import { ForcePasswordReset } from "@/features/auth/components/force-password-reset";

interface LifecycleGuardProps {
    children: React.ReactNode;
}

/**
 * LifecycleGuard - Authoritative route guard for account lifecycle.
 * 
 * CRITICAL: This component enforces routing rules BEFORE rendering children.
 * It returns null (or loader) while redirecting to prevent any flash of invalid content.
 * 
 * Rules:
 * 1. Unauthenticated → /sign-in (unless PUBLIC_ROUTE)
 * 2. Authenticated, mustResetPassword → show ForcePasswordReset screen
 * 3. Authenticated, no account type → /onboarding
 * 4. PERSONAL, no workspace → /onboarding
 * 5. ORG, no org → /onboarding
 * 6. ORG, no workspace → allow /welcome ONLY, block /workspaces/*
 * 7. Fully setup → block /onboarding and /welcome
 */
export function LifecycleGuard({ children }: LifecycleGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { lifecycleState, isLoaded, refreshLifecycle } = useAccountLifecycle();
    const redirectingRef = useRef(false);

    // Determine route type
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    const isOnboardingRoute = ONBOARDING_ROUTES.some(route => pathname.startsWith(route));

    useEffect(() => {
        // Skip if not loaded yet or already redirecting
        if (!isLoaded || redirectingRef.current) return;

        // Skip guards for public routes
        if (isPublicRoute) return;

        // Skip if mustResetPassword - we'll show the reset screen instead
        if (lifecycleState.mustResetPassword) return;

        const { isAuthenticated, accountType, hasOrg, hasWorkspace, activeWorkspaceId, orgRole } = lifecycleState;

        // Rule 1: Unauthenticated on protected route
        if (!isAuthenticated) {
            redirectingRef.current = true;
            router.push("/sign-in");
            return;
        }

        // Rule 3: No account type selected
        if (!accountType && !pathname.startsWith("/onboarding")) {
            redirectingRef.current = true;
            router.push("/onboarding");
            return;
        }

        // Rule 4: PERSONAL account without workspace
        if (accountType === "PERSONAL" && !hasWorkspace && !pathname.startsWith("/onboarding")) {
            redirectingRef.current = true;
            router.push("/onboarding");
            return;
        }

        // ============================================================
        // CRITICAL ROLE-BASED RULE: Non-OWNER ORG members
        // ============================================================
        // ADMIN, MODERATOR, MEMBER must NEVER see org onboarding.
        // They are added by an OWNER, not responsible for setup.
        if (accountType === "ORG" && orgRole && orgRole !== "OWNER") {
            // HARD BLOCK onboarding routes for non-owners
            if (pathname.startsWith("/onboarding")) {
                redirectingRef.current = true;
                // Send to workspace if assigned, else welcome
                if (hasWorkspace && activeWorkspaceId) {
                    router.push(`/workspaces/${activeWorkspaceId}`);
                } else {
                    router.push("/welcome");
                }
                return;
            }
        }

        // Rule 5: ORG OWNER without org → onboarding
        if (accountType === "ORG" && !hasOrg && !isOnboardingRoute) {
            redirectingRef.current = true;
            router.push("/onboarding");
            return;
        }

        // Rule 6: ORG account with org but no workspace
        if (accountType === "ORG" && hasOrg && !hasWorkspace) {
            // Allow /welcome, /organization, onboarding routes (for OWNER only)
            const allowedPaths = ["/welcome", "/organization", ...ONBOARDING_ROUTES];
            const isAllowed = allowedPaths.some(p => pathname.startsWith(p));

            if (!isAllowed && pathname.startsWith("/workspaces")) {
                redirectingRef.current = true;
                router.push("/welcome");
                return;
            }
        }

        // Rule 7: Fully setup - block onboarding and welcome
        if (hasWorkspace) {
            if (pathname.startsWith("/onboarding") || pathname === "/welcome") {
                redirectingRef.current = true;
                router.push(activeWorkspaceId ? `/workspaces/${activeWorkspaceId}` : "/");
                return;
            }
        }

        // Reset redirect flag since no redirect happened
        redirectingRef.current = false;
    }, [isLoaded, isPublicRoute, isOnboardingRoute, lifecycleState, pathname, router]);

    // ZERO-FLASH: Show loader while state is loading or redirecting
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Rule 2: Force password reset for ORG members on first login
    if (lifecycleState.isAuthenticated && lifecycleState.mustResetPassword) {
        return <ForcePasswordReset onSuccess={() => refreshLifecycle()} />;
    }

    // If redirecting, don't render children
    if (redirectingRef.current) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        );
    }

    // All guards passed - render children
    return <>{children}</>;
}
