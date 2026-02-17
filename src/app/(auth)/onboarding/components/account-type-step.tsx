"use client";

import { useState } from "react";
import { Building2, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountTypeStepProps {
    currentStep: number;
    totalSteps: number;
    onSelectAccountType: (type: "PERSONAL" | "ORG") => void;
}

/**
 * Step 1: Account Type Selection
 * Minimal card-based selection inspired by StartGlobal UI.
 */
export function AccountTypeStep({ onSelectAccountType }: AccountTypeStepProps) {
    const [selected, setSelected] = useState<"PERSONAL" | "ORG" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = (type: "PERSONAL" | "ORG") => {
        if (isSubmitting) return;
        setSelected(type);
        setIsSubmitting(true);
        // Small delay for visual feedback then advance
        setTimeout(() => {
            onSelectAccountType(type);
        }, 250);
    };

    return (
        <div className="w-full ">
            {/* Heading */}
            <div className="mb-8 flex flex-col items-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                    Choose the type of account
                </h1>
                <p className="mt-2 text-muted-foreground text-xs sm:text-sm">
                    Setting up your Fairlx account is just a few steps away.
                    <br />
                    Select the option that best fits your needs.
                </p>
            </div>

            {/* Selection Cards */}
            <div className="mt-8 space-y-4">
                {/* Personal */}
                <button
                    type="button"
                    onClick={() => handleSelect("PERSONAL")}
                    disabled={isSubmitting}
                    className={cn(
                        "w-full flex items-center gap-5 p-5 rounded-xl border-2 transition-all duration-200 text-left group",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        selected === "PERSONAL"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                            : "border-border hover:border-blue-400 hover:bg-muted/50 dark:hover:bg-muted/30"
                    )}
                >
                    {/* Icon */}
                    <div
                        className={cn(
                            "shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-200",
                            selected === "PERSONAL"
                                ? "bg-blue-500 text-white"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                        )}
                    >
                        <User className="w-7 h-7" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-foreground">
                            Personal
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            For individuals &amp; solo developers
                        </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                        className={cn(
                            "w-5 h-5 shrink-0 transition-all duration-200",
                            selected === "PERSONAL"
                                ? "text-blue-500 translate-x-0 opacity-100"
                                : "text-muted-foreground/40 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        )}
                    />
                </button>

                {/* Organization */}
                <button
                    type="button"
                    onClick={() => handleSelect("ORG")}
                    disabled={isSubmitting}
                    className={cn(
                        "w-full flex items-center gap-5 p-5 rounded-xl border-2 transition-all duration-200 text-left group",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        selected === "ORG"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                            : "border-border hover:border-blue-400 hover:bg-muted/50 dark:hover:bg-muted/30"
                    )}
                >
                    {/* Icon */}
                    <div
                        className={cn(
                            "shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-200",
                            selected === "ORG"
                                ? "bg-blue-500 text-white"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                        )}
                    >
                        <Building2 className="w-7 h-7" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-foreground ">
                            Organization
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            For teams &amp; companies
                        </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                        className={cn(
                            "w-5 h-5 shrink-0 transition-all duration-200",
                            selected === "ORG"
                                ? "text-blue-500 translate-x-0 opacity-100"
                                : "text-muted-foreground/40 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        )}
                    />
                </button>
            </div>
        </div>
    );
}
