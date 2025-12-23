"use client";

import { useCurrent } from "@/features/auth/api/use-current";
import { AccountType } from "../types";

/**
 * Hook to get the current user's account type from preferences
 * 
 * WHY: Account type is stored explicitly in user.prefs
 * - PERSONAL: Single workspace, user-level billing
 * - ORG: Multiple workspaces, organization-level billing
 * 
 * Returns:
 * - accountType: "PERSONAL" | "ORG" | undefined
 * - isPersonal: true if PERSONAL account
 * - isOrg: true if ORG account
 * - primaryOrganizationId: The primary org ID for ORG accounts
 * - signupCompleted: Whether workspace/org creation is done
 */
export const useAccountType = () => {
    const { data: user, isLoading } = useCurrent();

    const prefs = user?.prefs || {};
    const accountType = (prefs.accountType as AccountType) || AccountType.PERSONAL;
    const primaryOrganizationId = prefs.primaryOrganizationId as string | undefined;
    const signupCompletedAt = prefs.signupCompletedAt as string | undefined;

    return {
        accountType,
        isPersonal: accountType === AccountType.PERSONAL,
        isOrg: accountType === AccountType.ORG,
        primaryOrganizationId,
        signupCompleted: !!signupCompletedAt,
        isLoading,
    };
};
