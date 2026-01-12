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
 * - Magic link first login
 * 
 * ROLE-AWARE ROUTING LOGIC:
 * 
 * | Account Type | Org Role | Has Workspace | Route                    |
 * |--------------|----------|---------------|--------------------------|
 * | None         | -        | -             | /onboarding              |
 * | PERSONAL     | -        | No            | /onboarding/workspace    |
 * | PERSONAL     | -        | Yes           | /workspaces/:id          |
 * | ORG          | OWNER    | No            | /onboarding/organization |
 * | ORG          | OWNER    | Yes           | /workspaces/:id          |
 * | ORG          | !OWNER   | No            | /welcome (RESTRICTED)    |
 * | ORG          | !OWNER   | Yes           | /workspaces/:id          |
 * 
 * CRITICAL: Non-OWNER org members NEVER see onboarding.
 */

interface UserState {
    accountType: "PERSONAL" | "ORG" | null;
    orgRole: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER" | null;
    defaultWorkspaceId: string | null;
    orgSetupComplete: boolean;
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
        const emailVerified = user.emailVerification === true;
        const accountType = prefs.accountType as "PERSONAL" | "ORG" | null ?? null;
        const orgSetupComplete = prefs.orgSetupComplete === true;

        // Check if user needs onboarding (new user without account type)
        const needsOnboarding = !accountType && !prefs.signupCompletedAt;

        // For ORG accounts, fetch org membership to get role
        let orgRole: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER" | null = null;

        if (accountType === "ORG") {
            try {
                const lifecycleResponse = await client.api.auth.lifecycle.$get();
                if (lifecycleResponse.ok) {
                    const { data: lifecycle } = await lifecycleResponse.json();
                    orgRole = lifecycle?.orgRole as typeof orgRole ?? null;
                }
            } catch {
                // Lifecycle fetch failed, treat as unknown role
            }
        }

        // Try to get default workspace
        let defaultWorkspaceId: string | null = null;

        try {
            const workspacesResponse = await client.api.workspaces.$get();
            if (workspacesResponse.ok) {
                const { data: workspaces } = await workspacesResponse.json();
                if (workspaces?.documents?.length > 0) {
                    defaultWorkspaceId = workspaces.documents[0].$id;
                }
            }
        } catch {
            // Workspaces fetch failed
        }

        return {
            accountType,
            orgRole,
            defaultWorkspaceId,
            orgSetupComplete,
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

                // ============================================================
                // ROUTING DECISION TREE (Role-Aware)
                // ============================================================

                // 1. No account type → onboarding (new user)
                if (state.needsOnboarding) {
                    router.replace("/onboarding");
                    return;
                }

                // 2. PERSONAL account
                if (state.accountType === "PERSONAL") {
                    if (state.defaultWorkspaceId) {
                        router.replace(`/workspaces/${state.defaultWorkspaceId}`);
                    } else {
                        router.replace("/onboarding/workspace");
                    }
                    return;
                }

                // 3. ORG account - role-aware routing
                if (state.accountType === "ORG") {
                    // 3a. Has workspace → go to it
                    if (state.defaultWorkspaceId) {
                        router.replace(`/workspaces/${state.defaultWorkspaceId}`);
                        return;
                    }

                    // 3b. No workspace - check role
                    if (state.orgRole === "OWNER") {
                        // OWNER without workspace → onboarding
                        if (!state.orgSetupComplete) {
                            router.replace("/onboarding/organization");
                        } else {
                            router.replace("/onboarding/workspace");
                        }
                    } else {
                        // NON-OWNER without workspace → /welcome (RESTRICTED MODE)
                        // They will see the restricted welcome page
                        router.replace("/welcome");
                    }
                    return;
                }

                // Fallback: Unknown state → onboarding
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

