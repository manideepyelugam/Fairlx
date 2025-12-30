"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { client } from "@/lib/rpc";

/**
 * Post-Auth Callback Resolver
 * 
 * This page is the SINGLE entry point after ALL authentication methods:
 * - Email/Password login
 * - Google OAuth
 * - GitHub OAuth
 * - Email verification
 * 
 * ROUTING LOGIC:
 * | PersonalAccount | Org Memberships | Route                    |
 * |-----------------|-----------------|--------------------------|
 * | None            | None            | /onboarding              |
 * | Exists          | None            | /app (or /workspaces/id) |
 * | None            | Has orgs        | /org/select              |
 * | Exists          | Has orgs        | /context-switcher        |
 * 
 * WHY this pattern:
 * - OAuth provider type does NOT affect routing
 * - Same email always resolves to same user
 * - Account type selection happens POST-AUTH in onboarding
 */

interface UserState {
    hasPersonalAccount: boolean;
    hasOrganizations: boolean;
    defaultWorkspaceId: string | null;
    primaryOrganizationId: string | null;
    needsOnboarding: boolean;
    emailVerified: boolean;
}

async function fetchUserState(): Promise<UserState | null> {
    try {
        // Fetch current user
        const userResponse = await client.api.auth.current.$get();
        if (!userResponse.ok) {
            return null;
        }
        const { data: user } = await userResponse.json();
        if (!user) {
            return null;
        }

        const prefs = user.prefs || {};

        // ENTERPRISE: Check email verification status
        const emailVerified = user.emailVerification === true;

        // Check if user needs onboarding (new user without account type set)
        const needsOnboarding = prefs.needsOnboarding === true ||
            (!prefs.accountType && !prefs.signupCompletedAt);

        // For users with completed onboarding, check their accounts
        const hasPersonalAccount = prefs.accountType === "PERSONAL" &&
            prefs.signupCompletedAt !== null;

        const hasOrganizations = !!prefs.primaryOrganizationId;
        const primaryOrganizationId = prefs.primaryOrganizationId as string | null || null;

        // Try to get default workspace
        let defaultWorkspaceId: string | null = null;

        if (!needsOnboarding) {
            try {
                const workspacesResponse = await client.api.workspaces.$get();
                if (workspacesResponse.ok) {
                    const { data: workspaces } = await workspacesResponse.json();
                    if (workspaces && workspaces.documents && workspaces.documents.length > 0) {
                        defaultWorkspaceId = workspaces.documents[0].$id;
                    }
                }
            } catch {
                // Workspaces fetch failed, but that's okay for routing
            }
        }

        return {
            hasPersonalAccount,
            hasOrganizations,
            defaultWorkspaceId,
            primaryOrganizationId,
            needsOnboarding,
            emailVerified,
        };
    } catch {
        return null;
    }
}

export default function AuthCallbackPage() {
    const router = useRouter();
    const { data: user, isLoading: isUserLoading } = useCurrent();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function resolveRoute() {
            if (isUserLoading) return;

            // If no user, redirect to sign-in
            if (!user) {
                router.replace("/sign-in");
                return;
            }

            try {
                const state = await fetchUserState();

                if (!state) {
                    setError("Failed to determine user state");
                    return;
                }

                // ROUTING DECISION TREE
                if (state.needsOnboarding) {
                    // New user needs to complete onboarding
                    router.replace("/onboarding");
                    return;
                }

                if (state.hasPersonalAccount && !state.hasOrganizations) {
                    // Personal account only - go to workspace or app
                    if (state.defaultWorkspaceId) {
                        router.replace(`/workspaces/${state.defaultWorkspaceId}`);
                    } else {
                        router.replace("/onboarding/workspace");
                    }
                    return;
                }

                if (!state.hasPersonalAccount && state.hasOrganizations) {
                    // Org only - go to org selector
                    if (state.defaultWorkspaceId) {
                        router.replace(`/workspaces/${state.defaultWorkspaceId}`);
                    } else {
                        router.replace("/onboarding/workspace");
                    }
                    return;
                }

                if (state.hasPersonalAccount && state.hasOrganizations) {
                    // Both - go to context switcher (or default workspace)
                    if (state.defaultWorkspaceId) {
                        router.replace(`/workspaces/${state.defaultWorkspaceId}`);
                    } else {
                        router.replace("/");
                    }
                    return;
                }

                // Fallback: No accounts at all, go to onboarding
                router.replace("/onboarding");
            } catch (err) {
                console.error("Auth callback error:", err);
                setError("An error occurred during authentication");
            }
        }

        resolveRoute();
    }, [user, isUserLoading, router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive">{error}</p>
                <button
                    onClick={() => router.replace("/sign-in")}
                    className="text-primary underline"
                >
                    Return to Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Setting up your account...</p>
        </div>
    );
}
