"use client";

import { useCurrent } from "@/features/auth/api/use-current";
import { OnboardingStep } from "@/components/onboarding-stepper";

/**
 * Onboarding State Hook
 * 
 * Provides current onboarding step derived from user prefs and verification status.
 * 
 * State derivation logic:
 * - No emailVerification → EMAIL_VERIFICATION step
 * - ORG account without orgSetupComplete → ORG_SETUP step
 * - ORG account without workspace → WORKSPACE_SETUP step
 * - Otherwise → COMPLETED
 */

export interface OnboardingState {
    currentStep: OnboardingStep;
    accountType: "PERSONAL" | "ORG";
    isComplete: boolean;
    isLoading: boolean;
    requiredRoute: string | null;
}

export function useOnboardingState(): OnboardingState {
    const { data: user, isLoading } = useCurrent();

    if (isLoading || !user) {
        return {
            currentStep: OnboardingStep.SIGNUP,
            accountType: "PERSONAL",
            isComplete: false,
            isLoading: true,
            requiredRoute: null,
        };
    }

    const prefs = user.prefs || {};
    const accountType: "PERSONAL" | "ORG" = prefs.accountType || "PERSONAL";
    const emailVerified = user.emailVerification === true;
    const orgSetupComplete = prefs.orgSetupComplete === true;
    const primaryOrganizationId = prefs.primaryOrganizationId;

    // Derive current step from state
    let currentStep: OnboardingStep;
    let requiredRoute: string | null = null;

    if (!emailVerified) {
        currentStep = OnboardingStep.EMAIL_VERIFICATION;
        requiredRoute = "/verify-email-needed";
    } else if (accountType === "ORG" && !orgSetupComplete) {
        currentStep = OnboardingStep.ORG_SETUP;
        requiredRoute = "/onboarding/organization";
    } else if (accountType === "ORG" && !primaryOrganizationId) {
        // Edge case: verified but no org created yet
        currentStep = OnboardingStep.ORG_SETUP;
        requiredRoute = "/onboarding/organization";
    } else {
        currentStep = OnboardingStep.COMPLETED;
        requiredRoute = null;
    }

    const isComplete = currentStep === OnboardingStep.COMPLETED;

    return {
        currentStep,
        accountType,
        isComplete,
        isLoading: false,
        requiredRoute,
    };
}

/**
 * Get the step number from onboarding step stored in prefs
 */
export function getOnboardingStepFromPrefs(prefs: Record<string, unknown>): OnboardingStep {
    const step = prefs.onboardingStep as string | undefined;

    switch (step) {
        case "SIGNUP_COMPLETED":
            return OnboardingStep.SIGNUP;
        case "EMAIL_VERIFIED":
            return OnboardingStep.EMAIL_VERIFICATION;
        case "ORG_SETUP_COMPLETED":
            return OnboardingStep.ORG_SETUP;
        case "WORKSPACE_SETUP_COMPLETED":
            return OnboardingStep.WORKSPACE_SETUP;
        case "COMPLETED":
        case "WORKSPACE_SKIPPED": // User intentionally skipped workspace creation
            return OnboardingStep.COMPLETED;
        default:
            return OnboardingStep.SIGNUP;
    }
}
