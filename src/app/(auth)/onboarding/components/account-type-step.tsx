"use client";

import { useState } from "react";
import { Building2, User, Check, ArrowRight, Users, Briefcase, Shield, Zap, Sparkles, Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

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

                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                            How will you use Fairlx?
                        </h1>
                        <Dialog>
                            <DialogTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                                    aria-label="Learn more about account types"
                                >
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">Account Types Comparison</DialogTitle>
                                    <DialogDescription>
                                        Both account types share core features. Organization adds team collaboration and billing management.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 mt-4">
                                    {/* Shared Features Section */}
                                    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 rounded-lg bg-green-500/10">
                                                <Check className="w-5 h-5 text-green-500" />
                                            </div>
                                            <h3 className="font-semibold text-lg">Available in Both Account Types</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {/* Work Management */}
                                            <div className="space-y-2">
                                                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Work Management</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Unlimited workspaces</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Spaces (logical grouping for projects)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Projects (Scrum, Kanban, Hybrid)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Work items (Tasks, Stories, Bugs, Epics)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Subtasks & dependencies</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Personal backlog</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Agile & Planning */}
                                            <div className="space-y-2">
                                                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Agile & Planning</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Sprint management & velocity</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Custom workflows & statuses</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Kanban boards with WIP limits</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Timeline & calendar views</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Time tracking & estimates</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Saved views & filters</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customization */}
                                            <div className="space-y-2">
                                                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Customization</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Custom fields (text, date, select, etc.)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Labels & tags</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Custom columns</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Work item links & relationships</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Collaboration & Integration */}
                                            <div className="space-y-2">
                                                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Collaboration & AI</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Comments & @mentions</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>File attachments (50MB)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>Project documentation (5GB)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>GitHub integration</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>AI workflow assistant</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                                        <span>AI code documentation</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Type Cards */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Personal Account */}
                                        <div className="rounded-xl border border-blue-500/30 p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-blue-500/10">
                                                    <User className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <h3 className="font-semibold text-lg">Personal</h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                For solo developers, freelancers, and individuals.
                                            </p>

                                            <div className="space-y-2 text-sm mb-4">
                                                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Includes</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>All shared features above</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>Individual account ownership</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>Quick setup (no org config)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>Project teams (per-project)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Personal Hierarchy */}
                                            <div className="p-3 bg-blue-500/5 rounded-lg">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">HIERARCHY</p>
                                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 font-medium">You</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Workspaces</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Spaces</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Projects</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Tasks</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Organization Account */}
                                        <div className="rounded-xl border border-purple-500/30 p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 rounded-lg bg-purple-500/10">
                                                    <Building2 className="w-5 h-5 text-purple-500" />
                                                </div>
                                                <h3 className="font-semibold text-lg">Organization</h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                For teams, companies, and agencies.
                                            </p>

                                            <div className="space-y-2 text-sm mb-4">
                                                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Everything in Personal, Plus</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-purple-500" />
                                                        <span>Multi-user member management</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-purple-500" />
                                                        <span>Unified billing & invoicing</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-purple-500" />
                                                        <span>Departments & permissions</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-purple-500" />
                                                        <span>Roles (Owner, Admin, Moderator, Member)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-purple-500" />
                                                        <span>Organization-wide audit logs</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-purple-500" />
                                                        <span>Organization settings & branding</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Organization Hierarchy */}
                                            <div className="p-3 bg-purple-500/5 rounded-lg">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">HIERARCHY</p>
                                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-600 font-medium">Org</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Workspaces</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Spaces</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Projects</span>
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span className="px-2 py-1 rounded bg-muted">Tasks</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Note */}
                                    <p className="text-xs text-muted-foreground text-center">
                                        You can upgrade from Personal to Organization later if your needs change.
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
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
                                    Manage your tasks, sprints, and workflows — perfect for solo developers and independent professionals.
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
                                    Unified billing, departments, and member management — ideal for teams and growing companies.
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
