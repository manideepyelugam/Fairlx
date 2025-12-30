"use client";

import { useState } from "react";
import { Building2, User, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
 * - Checkmark on selected card
 * - Continue disabled until selection
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
        <Card className="w-full max-w-xl shadow-lg">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold">Welcome to Fairlx! 🎉</CardTitle>
                <CardDescription className="text-base">
                    Choose how you&apos;d like to use Fairlx
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {/* Personal Account Option */}
                <button
                    type="button"
                    onClick={() => setSelected("PERSONAL")}
                    className={cn(
                        "w-full p-5 rounded-xl border-2 transition-all duration-200 text-left group relative",
                        "hover:border-primary/60 hover:shadow-md",
                        selected === "PERSONAL"
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-muted hover:bg-muted/30"
                    )}
                    disabled={isSubmitting}
                >
                    {/* Selection Checkmark */}
                    {selected === "PERSONAL" && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    )}

                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-3 rounded-xl transition-colors",
                            selected === "PERSONAL"
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                            <User className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn(
                                "font-semibold text-lg",
                                selected === "PERSONAL" && "text-primary"
                            )}>
                                Personal Workspace
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                For individual use. Perfect for freelancers, personal projects, or solo work.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs bg-muted px-2 py-1 rounded-full">Single user</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded-full">Personal projects</span>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Organization Account Option */}
                <button
                    type="button"
                    onClick={() => setSelected("ORG")}
                    className={cn(
                        "w-full p-5 rounded-xl border-2 transition-all duration-200 text-left group relative",
                        "hover:border-primary/60 hover:shadow-md",
                        selected === "ORG"
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-muted hover:bg-muted/30"
                    )}
                    disabled={isSubmitting}
                >
                    {/* Selection Checkmark */}
                    {selected === "ORG" && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    )}

                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-3 rounded-xl transition-colors",
                            selected === "ORG"
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                            <Building2 className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn(
                                "font-semibold text-lg",
                                selected === "ORG" && "text-primary"
                            )}>
                                Organization / Team
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                For teams and companies. Collaborate with your organization members.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs bg-muted px-2 py-1 rounded-full">Team collaboration</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded-full">Role-based access</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded-full">Invite members</span>
                            </div>
                        </div>
                    </div>
                </button>

                <Button
                    onClick={handleContinue}
                    disabled={!selected || isSubmitting}
                    className="w-full mt-6"
                    size="lg"
                >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}

