"use client";

import { useState } from "react";
import { Building2, User, Check, ArrowRight, Users, Briefcase, Shield, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountTypeStepProps {
    currentStep: number;
    totalSteps: number;
    onSelectAccountType: (type: "PERSONAL" | "ORG") => void;
}

/**
 * Step 1: Account Type Selection
 * 
 * User chooses between PERSONAL and ORG account types.
 * This determines the subsequent onboarding flow.
 * 
 * ENTERPRISE DESIGN:
 * - Card-based selection with clear visual feedback
 * - Hover and selected states communicate affordance
 * - Strong CTA that reacts to selection state
 * - Clear differentiation between options
 */
export function AccountTypeStep({ onSelectAccountType }: AccountTypeStepProps) {
    const [selected, setSelected] = useState<"PERSONAL" | "ORG" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleContinue = () => {
        if (!selected) return;
        setIsSubmitting(true);
        onSelectAccountType(selected);
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Main Content - No separate card, blends with page */}
            <div className="p-6 sm:p-8">
                {/* Header Section */}
                <div className="text-center mb-10">
                    {/* Decorative Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-purple-500/15 border border-primary/20 mb-5">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        How will you use Fairlx?
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Select the option that best describes your needs. You can always invite team members later.
                    </p>
                </div>

                {/* Selection Cards */}
                <div className="space-y-4">
                    {/* Personal Account Option */}
                    <button
                        type="button"
                        onClick={() => setSelected("PERSONAL")}
                        className={cn(
                            "w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            selected === "PERSONAL"
                                ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]"
                                : "border-border bg-background hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg"
                        )}
                        disabled={isSubmitting}
                    >
                        {/* Selection Indicator */}
                        <div className={cn(
                            "absolute top-5 right-5 w-7 h-7 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                            selected === "PERSONAL"
                                ? "border-primary bg-primary scale-110"
                                : "border-muted-foreground/30 group-hover:border-primary/50 group-hover:scale-105"
                        )}>
                            {selected === "PERSONAL" && (
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            )}
                        </div>

                        <div className="flex items-start gap-5">
                            <div className={cn(
                                "p-4 rounded-2xl transition-all duration-300 shrink-0",
                                selected === "PERSONAL"
                                    ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                <User className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0 pr-10">
                                <h3 className={cn(
                                    "font-semibold text-xl transition-colors",
                                    selected === "PERSONAL" ? "text-primary" : "text-foreground"
                                )}>
                                    Personal Workspace
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    For individual use — freelancers, personal projects, or solo work.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300",
                                        selected === "PERSONAL"
                                            ? "bg-primary/15 text-primary"
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary/80"
                                    )}>
                                        <Zap className="w-3.5 h-3.5" />
                                        Quick setup
                                    </span>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300",
                                        selected === "PERSONAL"
                                            ? "bg-primary/15 text-primary"
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary/80"
                                    )}>
                                        <Briefcase className="w-3.5 h-3.5" />
                                        Personal projects
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Organization Account Option */}
                    <button
                        type="button"
                        onClick={() => setSelected("ORG")}
                        className={cn(
                            "w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            selected === "ORG"
                                ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]"
                                : "border-border bg-background hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg"
                        )}
                        disabled={isSubmitting}
                    >
                        {/* Selection Indicator */}
                        <div className={cn(
                            "absolute top-5 right-5 w-7 h-7 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                            selected === "ORG"
                                ? "border-primary bg-primary scale-110"
                                : "border-muted-foreground/30 group-hover:border-primary/50 group-hover:scale-105"
                        )}>
                            {selected === "ORG" && (
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            )}
                        </div>

                        <div className="flex items-start gap-5">
                            <div className={cn(
                                "p-4 rounded-2xl transition-all duration-300 shrink-0",
                                selected === "ORG"
                                    ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                <Building2 className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0 pr-10">
                                <h3 className={cn(
                                    "font-semibold text-xl transition-colors",
                                    selected === "ORG" ? "text-primary" : "text-foreground"
                                )}>
                                    Organization / Team
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    For teams and companies — collaborate with members across workspaces.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300",
                                        selected === "ORG"
                                            ? "bg-primary/15 text-primary"
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary/80"
                                    )}>
                                        <Users className="w-3.5 h-3.5" />
                                        Team collaboration
                                    </span>
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300",
                                        selected === "ORG"
                                            ? "bg-primary/15 text-primary"
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary/80"
                                    )}>
                                        <Shield className="w-3.5 h-3.5" />
                                        Role-based access
                                    </span>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* CTA Section */}
                <div className="mt-10">
                    <Button
                        onClick={handleContinue}
                        disabled={!selected || isSubmitting}
                        size="lg"
                        className={cn(
                            "w-full h-14 text-base font-semibold rounded-2xl transition-all duration-300",
                            selected
                                ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 hover:scale-[1.02]"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {isSubmitting ? (
                            "Setting up..."
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>

                    {/* Helper text */}
                    <p className={cn(
                        "text-center text-xs mt-4 transition-all duration-300",
                        selected ? "opacity-0" : "text-muted-foreground"
                    )}>
                        Select an option above to continue
                    </p>
                </div>
            </div>
        </div>
    );
}
