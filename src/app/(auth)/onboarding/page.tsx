"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { useOnboardingLocalState } from "@/features/onboarding/hooks/use-onboarding-local-state";
import { OnboardingErrorBoundary } from "./components/error-boundary";
import { OnboardingStepper, getStepsForAccountType } from "./components/onboarding-stepper";
import { AccountTypeStep } from "./components/account-type-step";
import { PersonalWorkspaceStep } from "./components/personal-workspace-step";
import { OrgDetailsStep } from "./components/org-details-step";
import { OrgWorkspaceStep } from "./components/org-workspace-step";
import { CompletionStep } from "./components/completion-step";

/**
 * Main Onboarding Page
 * 
 * ENTERPRISE DESIGN:
 * - Horizontal progress stepper at top
 * - Clickable completed steps for navigation
 * - Locked future steps prevent skipping
 * - Local state for refresh safety
 * 
 * FLOW:
 * - Step 1: Account Type Selection (PERSONAL vs ORG)
 * 
 * PERSONAL Path:
 * - Step 2: Create Workspace
 * - Step 3: Completion
 * 
 * ORG Path:
 * - Step 2: Organization Details
 * - Step 3: Create Workspace (optional, can skip)
 * - Step 4: Completion
 */

function OnboardingContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: user, isLoading: isUserLoading } = useCurrent();
    const {
        state,
        isInitialized,
        setAccountType,
        setOrganization,
        setWorkspace,
        skipStep,
        completeOnboarding,
        goToStep,
        getTotalSteps
    } = useOnboardingLocalState();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Guard: Redirect if not authenticated
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace("/sign-in");
        }
    }, [isUserLoading, user, router]);

    // Handle completion redirect with double-submit prevention
    const handleComplete = useCallback(() => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        completeOnboarding();
        setIsRedirecting(true);

        if (state.workspaceId) {
            router.push(`/workspaces/${state.workspaceId}`);
        } else {
            router.push("/");
        }
    }, [isSubmitting, completeOnboarding, state.workspaceId, router]);

    // Wrap callbacks with double-submit prevention
    const handleAccountTypeSelect = useCallback((type: "PERSONAL" | "ORG") => {
        if (isSubmitting) return;
        setAccountType(type);
    }, [isSubmitting, setAccountType]);

    const handleOrgCreated = useCallback((orgId: string, orgName: string) => {
        if (isSubmitting) return;
        setOrganization(orgId, orgName);
        // Immediately invalidate lifecycle cache so sidebar has fresh state
        queryClient.invalidateQueries({ queryKey: ["account-lifecycle"] });
    }, [isSubmitting, setOrganization, queryClient]);

    const handleWorkspaceCreated = useCallback((workspaceId: string) => {
        if (isSubmitting) return;
        setWorkspace(workspaceId);
        // Invalidate both lifecycle and user-access caches
        queryClient.invalidateQueries({ queryKey: ["account-lifecycle"] });
        queryClient.invalidateQueries({ queryKey: ["user-access"] });
    }, [isSubmitting, setWorkspace, queryClient]);

    const handleSkipWorkspace = useCallback(() => {
        if (isSubmitting) return;
        skipStep("workspace");
    }, [isSubmitting, skipStep]);

    // Navigate to a completed step
    const handleStepClick = useCallback((stepNumber: number) => {
        if (isSubmitting) return;
        goToStep(stepNumber);
    }, [isSubmitting, goToStep]);

    // Show loading while initializing
    if (isUserLoading || !isInitialized || isRedirecting) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">Setting up your account...</p>
                </div>
            </div>
        );
    }

    // Get steps configuration based on account type
    const steps = getStepsForAccountType(state.accountType);
    const currentStep = state.step;

    // Render appropriate step based on state
    const renderStep = () => {
        // Step 1: Account Type Selection
        if (state.step === 1 || state.accountType === null) {
            return (
                <AccountTypeStep
                    currentStep={1}
                    totalSteps={getTotalSteps()}
                    onSelectAccountType={handleAccountTypeSelect}
                />
            );
        }

        // PERSONAL Flow
        if (state.accountType === "PERSONAL") {
            if (state.step === 2) {
                return (
                    <PersonalWorkspaceStep
                        currentStep={2}
                        totalSteps={getTotalSteps()}
                        userId={user?.$id || ""}
                        onWorkspaceCreated={handleWorkspaceCreated}
                    />
                );
            }
            // Step 3: Completion
            return (
                <CompletionStep
                    accountType="PERSONAL"
                    workspaceId={state.workspaceId}
                    onComplete={handleComplete}
                />
            );
        }

        // ORG Flow
        if (state.accountType === "ORG") {
            if (state.step === 2) {
                return (
                    <OrgDetailsStep
                        currentStep={2}
                        totalSteps={getTotalSteps()}
                        onOrgCreated={handleOrgCreated}
                    />
                );
            }
            if (state.step === 3) {
                return (
                    <OrgWorkspaceStep
                        currentStep={3}
                        totalSteps={getTotalSteps()}
                        organizationId={state.organizationId || ""}
                        organizationName={state.organizationName || ""}
                        onWorkspaceCreated={handleWorkspaceCreated}
                        onSkip={handleSkipWorkspace}
                    />
                );
            }
            // Step 4: Completion
            return (
                <CompletionStep
                    accountType="ORG"
                    organizationName={state.organizationName}
                    workspaceId={state.workspaceId}
                    onComplete={handleComplete}
                />
            );
        }

        // Fallback
        return null;
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Stepper */}
            <div className="mb-8 px-4">
                <OnboardingStepper
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />
            </div>

            {/* Main Content */}
            <div className="w-full">
                {renderStep()}
            </div>

            {/* Footer */}
            <footer className="mt-12 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                    Need help?{" "}
                    <a
                        href="mailto:contact@fairlx.com"
                        className="text-primary hover:underline font-medium"
                    >
                        Contact support
                    </a>
                </p>
            </footer>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <OnboardingErrorBoundary>
            <OnboardingContent />
        </OnboardingErrorBoundary>
    );
}
