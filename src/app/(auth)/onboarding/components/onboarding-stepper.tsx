"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepConfig {
    id: string;
    title: string;
    description?: string;
    optional?: boolean;
}

export type StepStatus = "completed" | "current" | "locked";

interface OnboardingStepperProps {
    steps: StepConfig[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
    className?: string;
}

/**
 * Horizontal Progress Stepper Component
 * 
 * ENTERPRISE DESIGN PATTERNS:
 * - Clear visual hierarchy: completed → current → locked
 * - Clickable completed steps for navigation
 * - Locked future steps prevent skipping
 * - Responsive: horizontal on desktop, compact on mobile
 * 
 * ACCESSIBILITY:
 * - ARIA labels for screen readers
 * - Keyboard navigable
 * - High contrast step indicators
 */
export function OnboardingStepper({
    steps,
    currentStep,
    onStepClick,
    className,
}: OnboardingStepperProps) {
    const getStepStatus = (index: number): StepStatus => {
        if (index < currentStep - 1) return "completed";
        if (index === currentStep - 1) return "current";
        return "locked";
    };

    const handleStepClick = (index: number) => {
        const status = getStepStatus(index);
        // Only allow clicking completed steps
        if (status === "completed" && onStepClick) {
            onStepClick(index + 1); // Convert to 1-indexed step number
        }
    };

    return (
        <nav
            className={cn("w-full max-w-3xl mx-auto", className)}
            aria-label="Onboarding progress"
        >
            <ol className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const status = getStepStatus(index);
                    const isLast = index === steps.length - 1;

                    return (
                        <li
                            key={step.id}
                            className={cn(
                                "flex items-center",
                                !isLast && "flex-1"
                            )}
                        >
                            {/* Step Circle */}
                            <button
                                type="button"
                                onClick={() => handleStepClick(index)}
                                disabled={status !== "completed"}
                                className={cn(
                                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                                    // Completed: Green checkmark
                                    status === "completed" && [
                                        "bg-emerald-500 border-emerald-500 text-white",
                                        "hover:bg-emerald-600 hover:border-emerald-600",
                                        "cursor-pointer"
                                    ],
                                    // Current: Primary color, pulsing
                                    status === "current" && [
                                        "bg-primary border-primary text-primary-foreground",
                                        "ring-4 ring-primary/20",
                                        "cursor-default"
                                    ],
                                    // Locked: Gray
                                    status === "locked" && [
                                        "bg-muted border-muted-foreground/30 text-muted-foreground",
                                        "cursor-not-allowed"
                                    ]
                                )}
                                aria-current={status === "current" ? "step" : undefined}
                                aria-label={`Step ${index + 1}: ${step.title}${step.optional ? " (optional)" : ""}`}
                            >
                                {status === "completed" ? (
                                    <Check className="w-5 h-5" />
                                ) : status === "locked" ? (
                                    <Lock className="w-4 h-4" />
                                ) : (
                                    <span className="text-sm font-semibold">{index + 1}</span>
                                )}
                            </button>

                            {/* Step Label (below circle on mobile, beside on desktop) */}
                            <div className="hidden sm:block ml-3 min-w-[100px]">
                                <p className={cn(
                                    "text-sm font-medium",
                                    status === "completed" && "text-emerald-600",
                                    status === "current" && "text-primary",
                                    status === "locked" && "text-muted-foreground"
                                )}>
                                    {step.title}
                                    {step.optional && (
                                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                                            (optional)
                                        </span>
                                    )}
                                </p>
                                {step.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {step.description}
                                    </p>
                                )}
                            </div>

                            {/* Connecting Line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        "flex-1 h-0.5 mx-4 transition-colors duration-200",
                                        status === "completed"
                                            ? "bg-emerald-500"
                                            : "bg-muted-foreground/30"
                                    )}
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    );
                })}
            </ol>

            {/* Mobile Step Labels (shown below stepper) */}
            <div className="sm:hidden mt-4 text-center">
                <p className="text-sm font-medium text-primary">
                    {steps[currentStep - 1]?.title}
                    {steps[currentStep - 1]?.optional && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                            (optional)
                        </span>
                    )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Step {currentStep} of {steps.length}
                </p>
            </div>
        </nav>
    );
}

/**
 * Get step configuration based on account type
 * 
 * PERSONAL: 3 steps
 * ORG: 4 steps (with optional workspace)
 */
export function getStepsForAccountType(accountType: "PERSONAL" | "ORG" | null): StepConfig[] {
    const accountTypeStep: StepConfig = {
        id: "account-type",
        title: "Account Type",
        description: "Choose your account type"
    };

    if (accountType === "PERSONAL") {
        return [
            accountTypeStep,
            {
                id: "workspace",
                title: "Create Workspace",
                description: "Set up your workspace"
            },
            {
                id: "complete",
                title: "Complete",
                description: "You're all set!"
            }
        ];
    }

    if (accountType === "ORG") {
        return [
            accountTypeStep,
            {
                id: "org-details",
                title: "Organization",
                description: "Set up your organization"
            },
            {
                id: "workspace",
                title: "Workspace",
                description: "Create a workspace",
                optional: true
            },
            {
                id: "complete",
                title: "Complete",
                description: "You're all set!"
            }
        ];
    }

    // Default before selection
    return [
        accountTypeStep,
        {
            id: "next-step",
            title: "Next Step",
            description: "Based on your selection"
        },
        {
            id: "complete",
            title: "Complete",
            description: "You're all set!"
        }
    ];
}
