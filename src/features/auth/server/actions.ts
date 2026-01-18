"use server";

import { createSessionClient } from "@/lib/appwrite";
import {
    DATABASE_ID,
    ORGANIZATIONS_ID,
    ORGANIZATION_MEMBERS_ID,
    MEMBERS_ID,
} from "@/config";
import { Query } from "node-appwrite";
import { AccountLifecycleState } from "../types";

/**
 * Resolves the full account lifecycle state for routing guards.
 * This is the SINGLE SOURCE OF TRUTH for: Has User -> Has Org -> Has Workspace.
 * 
 * All routing decisions in the app should be based on this resolved state.
 */
export async function resolveAccountLifecycleState(): Promise<AccountLifecycleState> {
    try {
        const { account, databases } = await createSessionClient();

        // 1. Get User
        const user = await account.get();
        if (!user) {
            return {
                isLoaded: true,
                isLoading: false,
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
        }

        const isEmailVerified = user.emailVerification;
        const accountType = user.prefs?.accountType || null;

        // 2. Resolve Active Organization
        let activeOrgId = user.prefs?.primaryOrganizationId || null;
        let hasOrg = false;
        let activeMember = null;

        // If user has a preferred org, verify membership
        if (activeOrgId) {
            try {
                const memberships = await databases.listDocuments(
                    DATABASE_ID,
                    ORGANIZATION_MEMBERS_ID,
                    [
                        Query.equal("organizationId", activeOrgId),
                        Query.equal("userId", user.$id)
                    ]
                );

                if (memberships.total > 0) {
                    hasOrg = true;
                    activeMember = memberships.documents[0];
                } else {
                    activeOrgId = null;
                }
            } catch {
                activeOrgId = null;
            }
        }

        // If no active org found via prefs, try to find ANY org
        if (!hasOrg) {
            const anyMembership = await databases.listDocuments(
                DATABASE_ID,
                ORGANIZATION_MEMBERS_ID,
                [Query.equal("userId", user.$id), Query.limit(1)]
            );

            if (anyMembership.total > 0) {
                hasOrg = true;
                activeMember = anyMembership.documents[0];
                activeOrgId = anyMembership.documents[0].organizationId;
            }
        }

        // 2.5. Fetch organization details for display (name, imageUrl)
        let activeOrgName: string | null = null;
        let activeOrgImageUrl: string | null = null;

        if (activeOrgId) {
            try {
                const orgDoc = await databases.getDocument(
                    DATABASE_ID,
                    ORGANIZATIONS_ID,
                    activeOrgId
                );
                activeOrgName = orgDoc.name || null;
                activeOrgImageUrl = orgDoc.imageUrl || null;
            } catch {
                // Organization fetch might fail due to permissions, but we still have activeOrgId
                // This is acceptable - the UI will show fallbacks
            }
        }

        // 3. Resolve Active Workspace
        let hasWorkspace = false;
        let activeWorkspaceId = null;

        const workspaceMemberships = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [Query.equal("userId", user.$id), Query.limit(1)]
        );

        if (workspaceMemberships.total > 0) {
            hasWorkspace = true;
            activeWorkspaceId = workspaceMemberships.documents[0].workspaceId;
        }

        // 4. Check if user must reset password (ORG member first login)
        const mustResetPassword = user.prefs?.mustResetPassword === true;

        // 5. Extract org role from active membership
        const orgRole = activeMember?.role as "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER" | null ?? null;

        return {
            isLoaded: true,
            isLoading: false,
            isAuthenticated: true,
            hasUser: true,
            isEmailVerified,
            hasOrg,
            hasWorkspace,
            user,
            accountType: accountType as "PERSONAL" | "ORG" | null,
            activeMember,
            activeOrgId,
            activeOrgName,
            activeOrgImageUrl,
            activeWorkspaceId,
            mustResetPassword,
            orgRole,
        };
    } catch {
        // If unauthenticated or error
        return {
            isLoaded: true,
            isLoading: false,
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
    }
}

// Legacy alias for backward compatibility during migration
export const resolveAccountState = resolveAccountLifecycleState;

