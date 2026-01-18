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
            className={cn("w-full max-w-2xl mx-auto", className)}
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
                            {/* Step Circle + Label Container */}
                            <div className="flex flex-col items-center">
                                {/* Step Circle */}
                                <button
                                    type="button"
                                    onClick={() => handleStepClick(index)}
                                    disabled={status !== "completed"}
                                    className={cn(
                                        "relative flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-300",
                                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                                        // Completed: Emerald with checkmark
                                        status === "completed" && [
                                            "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 text-white",
                                            "hover:from-emerald-600 hover:to-emerald-700 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/30",
                                            "cursor-pointer shadow-md"
                                        ],
                                        // Current: Primary with ring glow
                                        status === "current" && [
                                            "bg-gradient-to-br from-primary to-primary/90 border-primary text-primary-foreground",
                                            "ring-4 ring-primary/25 shadow-xl shadow-primary/20",
                                            "cursor-default animate-pulse"
                                        ],
                                        // Locked: Muted with subtle styling
                                        status === "locked" && [
                                            "bg-muted/30 border-border/50 text-muted-foreground/50",
                                            "cursor-not-allowed"
                                        ]
                                    )}
                                    aria-current={status === "current" ? "step" : undefined}
                                    aria-label={`Step ${index + 1}: ${step.title}${step.optional ? " (optional)" : ""}`}
                                >
                                    {status === "completed" ? (
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    ) : status === "locked" ? (
                                        <Lock className="w-4 h-4" />
                                    ) : (
                                        <span className="text-sm font-bold">{index + 1}</span>
                                    )}
                                </button>

                                {/* Step Label (visible on sm+) */}
                                <div className="hidden sm:block mt-3 text-center max-w-[100px]">
                                    <p className={cn(
                                        "text-xs font-medium leading-tight transition-colors",
                                        status === "completed" && "text-emerald-600 font-semibold",
                                        status === "current" && "text-primary font-semibold",
                                        status === "locked" && "text-muted-foreground/50"
                                    )}>
                                        {step.title}
                                        {step.optional && (
                                            <span className="block text-[10px] font-normal text-muted-foreground/60 mt-0.5">
                                                Optional
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Connecting Line */}
                            {!isLast && (
                                <div className="flex-1 mx-3 sm:mx-4 -mt-6 sm:mt-0">
                                    <div
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-500",
                                            status === "completed"
                                                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                                : "bg-border/40"
                                        )}
                                        aria-hidden="true"
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>

            {/* Mobile Step Label (shown below stepper) */}
            <div className="sm:hidden mt-5 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
                    <p className="text-sm font-semibold text-primary">
                        {steps[currentStep - 1]?.title}
                        {steps[currentStep - 1]?.optional && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                (optional)
                            </span>
                        )}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
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
                title: "Workspace",
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
            title: "Setup",
            description: "Based on your selection"
        },
        {
            id: "complete",
            title: "Complete",
            description: "You're all set!"
        }
    ];
}
