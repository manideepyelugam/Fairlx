"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, ShieldCheck, AlertCircle, Building2, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { LegalAcceptance } from "./legal-acceptance";
import { useAcceptLegal } from "../api/use-accept-legal";
import { useLogout } from "../api/use-logout";
import { useGetAccountLifecycle } from "../api/use-account-lifecycle";
import { OrganizationRole } from "@/features/organizations/types";

/**
 * Legal Acceptance Modal
 * 
 * GUARD SCREEN:
 * Blocks user interaction until the latest legal policies are accepted.
 * - For PERSONAL users: Must accept personally.
 * - For ORG Admins/Owners: Must accept on behalf of organization.
 * - For ORG Members: Blocked if organization hasn't accepted.
 * 
 * Design: Premium glassmorphism with vibrant gradients, consistent with onboarding.
 */
export function LegalAcceptanceModal() {
    const { lifecycleState, refreshLifecycle } = useGetAccountLifecycle();
    const mutation = useAcceptLegal();
    const logoutMutation = useLogout();

    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedDPA, setAcceptedDPA] = useState(false);
    const [applyToOrg, setApplyToOrg] = useState(false);

    const isManagement =
        lifecycleState.orgRole === OrganizationRole.OWNER ||
        lifecycleState.orgRole === OrganizationRole.ADMIN;

    const mustAccept = lifecycleState.mustAcceptLegal;
    const isBlocked = lifecycleState.legalBlocked;

    const handleAccept = () => {
        mutation.mutate({
            acceptedTerms: true,
            acceptedDPA: true,
            applyToOrg: applyToOrg && isManagement,
        }, {
            onSuccess: () => {
                refreshLifecycle();
            }
        });
    };

    // If neither blocked nor must accept, don't show anything (LifecycleGuard should handle this)
    if (!mustAccept && !isBlocked) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl p-4 overflow-y-auto">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Fairlx Logo */}
            <div className="mb-6 z-10">
                <Image
                    src="/Logo.png"
                    alt="Fairlx"
                    width={56}
                    height={44}
                    priority
                    className="drop-shadow-sm"
                />
            </div>

            <Card className="w-full max-w-lg shadow-2xl border-primary/10 bg-card/50 backdrop-blur-sm z-10 transition-all duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                        {isBlocked ? (
                            <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
                        ) : (
                            <ShieldCheck className="h-8 w-8 text-primary" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isBlocked ? "Action Required" : "Legal Policy Update"}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        {isBlocked
                            ? "Policy acceptance pending for your organization."
                            : "Please review and accept our updated legal terms to continue using Fairlx."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-6">
                    {/* Member Blocked State */}
                    {isBlocked && (
                        <div className="rounded-2xl bg-destructive/5 border border-destructive/10 p-6 text-center space-y-4">
                            <Building2 className="h-10 w-10 text-destructive/40 mx-auto" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">
                                    Your organization has not yet accepted the latest Service Agreement.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Please contact your Organization Owner or Administrator to accept the updated terms and unblock your access.
                                </p>
                            </div>
                            <Separator />
                            <p className="text-xs text-muted-foreground italic">
                                Note: Only Workspace Owners and Admins can accept terms for the entire organization.
                            </p>
                        </div>
                    )}

                    {/* Must Accept State */}
                    {mustAccept && (
                        <div className="space-y-6">
                            <div className="rounded-2xl bg-muted/50 p-4 border border-border/50">
                                <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <UserCircle className="h-4 w-4" />
                                    Personal Acceptance
                                </div>
                                <LegalAcceptance
                                    acceptedTerms={acceptedTerms}
                                    acceptedDPA={acceptedDPA}
                                    onAcceptedTermsChange={setAcceptedTerms}
                                    onAcceptedDPAChange={setAcceptedDPA}
                                    disabled={mutation.isPending}
                                />
                            </div>

                            {/* Org Admin/Owner specific checkbox */}
                            {isManagement && (
                                <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10 transition-all hover:bg-primary/10">
                                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-primary/70">
                                        <Building2 className="h-4 w-4" />
                                        Organization Compliance
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <Checkbox
                                            id="applyToOrg"
                                            checked={applyToOrg}
                                            onCheckedChange={(checked) => setApplyToOrg(!!checked)}
                                            disabled={mutation.isPending}
                                            className="mt-1"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor="applyToOrg"
                                                className="text-sm font-medium leading-normal cursor-pointer"
                                            >
                                                Apply these terms to my entire organization <span className="text-destructive">(Mandatory)</span>
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                By checking this, you accept these policies on behalf of all current and future members of your organization ({lifecycleState.activeOrgName || "Your Org"}).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    {!isBlocked && (
                        <Button
                            className="w-full h-12 text-base font-semibold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                            size="lg"
                            disabled={
                                mutation.isPending ||
                                !acceptedTerms ||
                                !acceptedDPA ||
                                (isManagement && !applyToOrg)
                            }
                            onClick={handleAccept}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Saving preference...
                                </>
                            ) : (
                                "Accept and Continue"
                            )}
                        </Button>
                    )}

                    <footer className="w-full text-center text-xs text-muted-foreground">
                        Questions about our policies? Check our{" "}
                        <a
                            href="https://fairlx.com/legal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                            Legal Center
                        </a>
                    </footer>
                </CardFooter>
            </Card>

            {/* Logout button for people who don't want to accept or are stuck */}
            <div className="mt-8 z-10">
                <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                    {logoutMutation.isPending ? "Logging out..." : "Log out of my account"}
                </button>
            </div>
        </div>
    );
}
