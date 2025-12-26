"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Onboarding Stepper Component
 * 
 * Visual representation of the onboarding progress.
 * Shows steps as completed, active, or pending.
 * 
 * PERSONAL accounts: Steps 1-2 only
 * ORG accounts: Steps 1-5
 */

export enum OnboardingStep {
    SIGNUP = 1,
    EMAIL_VERIFICATION = 2,
    ORG_SETUP = 3,
    WORKSPACE_SETUP = 4,
    COMPLETED = 5,
}

interface Step {
    id: number;
    name: string;
    description: string;
}

const PERSONAL_STEPS: Step[] = [
    { id: 1, name: "Account", description: "Create your account" },
    { id: 2, name: "Verify Email", description: "Confirm your email" },
];

const ORG_STEPS: Step[] = [
    { id: 1, name: "Account", description: "Create your account" },
    { id: 2, name: "Verify Email", description: "Confirm your email" },
    { id: 3, name: "Organization", description: "Set up your organization" },
    { id: 4, name: "Workspace", description: "Create a workspace" },
    { id: 5, name: "Complete", description: "Enter the app" },
];

interface OnboardingStepperProps {
    currentStep: OnboardingStep;
    accountType: "PERSONAL" | "ORG";
    className?: string;
}

export function OnboardingStepper({
    currentStep,
    accountType,
    className
}: OnboardingStepperProps) {
    const steps = accountType === "ORG" ? ORG_STEPS : PERSONAL_STEPS;

    return (
        <nav aria-label="Progress" className={cn("w-full", className)}>
            <ol className="flex items-center justify-center gap-2">
                {steps.map((step, index) => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;
                    const isPending = step.id > currentStep;

                    return (
                        <li
                            key={step.id}
                            className="flex items-center"
                        >
                            {/* Step indicator */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full border-2 font-medium transition-colors",
                                        isCompleted && "border-primary bg-primary text-primary-foreground",
                                        isActive && "border-primary bg-primary/10 text-primary",
                                        isPending && "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <span>{step.id}</span>
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p
                                        className={cn(
                                            "text-sm font-medium",
                                            isActive && "text-primary",
                                            isPending && "text-muted-foreground"
                                        )}
                                    >
                                        {step.name}
                                    </p>
                                </div>
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "mx-2 h-0.5 w-8 sm:w-12",
                                        step.id < currentStep
                                            ? "bg-primary"
                                            : "bg-muted-foreground/30"
                                    )}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/**
 * Compact version for smaller spaces
 */
export function OnboardingStepperCompact({
    currentStep,
    accountType,
}: OnboardingStepperProps) {
    const steps = accountType === "ORG" ? ORG_STEPS : PERSONAL_STEPS;
    const currentStepData = steps.find((s) => s.id === currentStep);

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
                Step {currentStep} of {steps.length}
            </span>
            <span>•</span>
            <span>{currentStepData?.name}</span>
        </div>
    );
}
