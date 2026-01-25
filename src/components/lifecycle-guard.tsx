"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccountLifecycle } from "@/components/account-lifecycle-provider";
import { PUBLIC_ROUTES } from "@/features/auth/constants";
import { Loader2 } from "lucide-react";
import { ForcePasswordReset } from "@/features/auth/components/force-password-reset";

interface LifecycleGuardProps {
    children: React.ReactNode;
}

/**
 * LifecycleGuard - Authoritative route guard for account lifecycle.
 * 
 * MIGRATED: Now consumes server-side routing rules via `lifecycleRouting`.
 * The UI no longer guesses permissions; it strictly enforces what the server says.
 */
export function LifecycleGuard({ children }: LifecycleGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { lifecycleState, lifecycleRouting, isLoaded, refreshLifecycle } = useAccountLifecycle();
    const redirectingRef = useRef(false);
    const lastPathnameRef = useRef(pathname);

    // Reset redirecting flag when pathname actually changes
    useEffect(() => {
        if (pathname !== lastPathnameRef.current) {
            redirectingRef.current = false;
            lastPathnameRef.current = pathname;
        }
    }, [pathname]);

    // Determine route type
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    useEffect(() => {
        // Skip if not loaded yet or already redirecting
        if (!isLoaded || redirectingRef.current) return;

        // Skip guards for public routes
        if (isPublicRoute) {
            // Special case: If user is authenticated and on sign-in/sign-up,
            // redirect them to their allowed home
            if (lifecycleState.isAuthenticated) {
                if (lifecycleRouting.redirectTo && lifecycleRouting.redirectTo !== pathname) {
                    redirectingRef.current = true;
                    router.push(lifecycleRouting.redirectTo);
                    return;
                }
            }
            return;
        }

        // 1. Force Redirect (Server Authority)
        // If server explicitly says "Go here" AND we aren't already there.
        if (lifecycleRouting.redirectTo) {
            const targetPath = lifecycleRouting.redirectTo;
            const isAtTarget = pathname === targetPath || pathname.startsWith(targetPath + "/");

            if (!isAtTarget) {
                redirectingRef.current = true;
                router.push(targetPath);
                return;
            }
            // We're at the redirect target - no further checks needed
            return;
        }

        // 2. Blocked Paths (Server Authority)
        // Check if current path is strictly blocked by server state
        const isBlocked = lifecycleRouting.blockedPaths.some(blocked => {
            if (blocked === "*") return true;
            if (blocked.endsWith("/*")) {
                const prefix = blocked.slice(0, -2);
                return pathname.startsWith(prefix);
            }
            return pathname === blocked || pathname.startsWith(blocked + "/");
        });

        if (isBlocked) {
            // Find a safe fallback - prefer redirectTo if set, else check allowedPaths
            let fallback = "/welcome";

            // Check if /welcome is blocked
            const welcomeBlocked = lifecycleRouting.blockedPaths.some(b =>
                b === "/welcome" || b === "*"
            );

            if (welcomeBlocked && lifecycleRouting.allowedPaths.length > 0) {
                // Find first allowed concrete path
                const firstAllowed = lifecycleRouting.allowedPaths.find(p =>
                    !p.includes("*") && !p.includes("?")
                );
                if (firstAllowed) {
                    fallback = firstAllowed;
                }
            }

            if (pathname !== fallback) {
                redirectingRef.current = true;
                router.push(fallback);
            }
            return;
        }

    }, [isLoaded, isPublicRoute, lifecycleState.isAuthenticated, lifecycleRouting, pathname, router]);

    // ZERO-FLASH: Show loader while state is loading
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

    // Special Component Interception: ForcePasswordReset
    if (lifecycleState.isAuthenticated && lifecycleState.mustResetPassword) {
        return <ForcePasswordReset onSuccess={() => refreshLifecycle()} />;
    }

    // If redirecting, show spinner (but with timeout protection)
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
