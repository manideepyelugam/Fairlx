"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
    }, [isSubmitting, setOrganization]);

    const handleWorkspaceCreated = useCallback((workspaceId: string) => {
        if (isSubmitting) return;
        setWorkspace(workspaceId);
    }, [isSubmitting, setWorkspace]);

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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/30">
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
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header with Stepper */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b py-6 px-4">
                <OnboardingStepper
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                {renderStep()}
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-xs text-muted-foreground">
                Need help? Contact <a href="mailto:support@fairlx.com" className="underline hover:text-foreground">support@fairlx.com</a>
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

