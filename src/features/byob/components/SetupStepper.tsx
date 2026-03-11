"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";

import { SETUP_STEPS } from "../constants";
import { useBYOBTenant } from "../api/use-byob-tenant";
import { OrgSlugInput } from "./OrgSlugInput";
import { CredentialInputStep } from "./CredentialInputStep";
import { AdditionalConfigStep } from "./AdditionalConfigStep";
import { DbInitProgress } from "./DbInitProgress";
import { OwnerAccountStep } from "./OwnerAccountStep";

interface SetupStepperProps {
    initialSlug?: string;
}

export const SetupStepper = ({ initialSlug }: SetupStepperProps) => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [orgSlug, setOrgSlug] = useState(initialSlug || "");
    const [orgName, setOrgName] = useState("");
    const [credentials, setCredentials] = useState<{
        endpoint: string;
        project: string;
        apiKey: string;
    } | null>(null);
    const [additionalConfig, setAdditionalConfig] = useState<Record<
        string,
        string
    >>({});
    const [isResuming, setIsResuming] = useState(!!initialSlug);

    // Check if tenant already exists (for resume on refresh)
    const { data: tenantData, isLoading: isCheckingTenant } = useBYOBTenant(orgSlug);

    useEffect(() => {
        if (!isResuming || isCheckingTenant || !orgSlug) return;

        if (tenantData && "success" in tenantData && tenantData.success) {
            const status = tenantData.status;
            const ownerPending =
                "ownerUserId" in tenantData &&
                (tenantData as { ownerUserId?: string }).ownerUserId === "pending";

            if (status === "ACTIVE" && ownerPending) {
                // DB done but owner account not created yet — resume at step 4
                if (tenantData.orgName) setOrgName(tenantData.orgName as string);
                setCurrentStep(4);
                setIsResuming(false);
                return;
            }

            if (status === "ACTIVE") {
                // Fully set up — go straight to "already done" view (step 3)
                setCurrentStep(3);
                setIsResuming(false);
                return;
            }

            if (status === "PENDING_SETUP" || status === "SETUP_IN_PROGRESS") {
                // Org exists but setup isn't complete — jump to credentials step
                setCurrentStep(1);
                setIsResuming(false);
                return;
            }
        }

        // No tenant found — stay on step 0 (create org)
        setIsResuming(false);
    }, [tenantData, isCheckingTenant, isResuming, orgSlug]);

    // Merge credentials + additional config into a full env vars object
    const fullEnvVars = useMemo(() => {
        if (!credentials) return {};
        return {
            NEXT_PUBLIC_APPWRITE_ENDPOINT: credentials.endpoint,
            NEXT_PUBLIC_APPWRITE_PROJECT: credentials.project,
            NEXT_APPWRITE_KEY: credentials.apiKey,
            NEXT_PUBLIC_APPWRITE_DATABASE_ID: "fairlx",
            ...additionalConfig,
        };
    }, [credentials, additionalConfig]);

    // Show loading state while checking tenant on initial load
    if (isResuming && isCheckingTenant) {
        return (
            <div className="w-full max-w-2xl mx-auto">
                <Card className="border shadow-sm">
                    <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Checking setup progress for <span className="font-mono font-medium">{orgSlug}</span>...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If tenant is ACTIVE and we're on step 3, show "already set up" instead of re-running init
    const tenantIsActive =
        tenantData &&
        "success" in tenantData &&
        tenantData.success &&
        tenantData.status === "ACTIVE";

    // Active but no owner yet — needs step 4
    const tenantNeedsOwner =
        tenantIsActive &&
        "ownerUserId" in tenantData &&
        (tenantData as { ownerUserId?: string }).ownerUserId === "pending";

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-8">
                {SETUP_STEPS.map((step, idx) => (
                    <div key={step.index} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${idx < currentStep
                                    ? "bg-green-500 text-white"
                                    : idx === currentStep
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {idx < currentStep ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    idx + 1
                                )}
                            </div>
                            <span
                                className={`text-xs mt-1 text-center max-w-[80px] ${idx === currentStep
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < SETUP_STEPS.length - 1 && (
                            <div
                                className={`h-[2px] w-12 sm:w-20 mx-2 mt-[-16px] ${idx < currentStep
                                    ? "bg-green-500"
                                    : "bg-muted"
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">
                        {SETUP_STEPS[currentStep]?.label}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {SETUP_STEPS[currentStep]?.description}
                    </p>
                </CardHeader>
                <div className="px-6">
                    <DottedSeparator />
                </div>
                <CardContent className="p-6">
                    {/* Step 0: Org Slug */}
                    {currentStep === 0 && (
                        <OrgSlugInput
                            defaultSlug={orgSlug}
                            onComplete={(slug, name) => {
                                setOrgSlug(slug);
                                setOrgName(name);
                                setCurrentStep(1);
                            }}
                        />
                    )}

                    {/* Step 1: Appwrite Credentials */}
                    {currentStep === 1 && (
                        <CredentialInputStep
                            defaultValues={
                                credentials
                                    ? {
                                        endpoint: credentials.endpoint,
                                        project: credentials.project,
                                        apiKey: credentials.apiKey,
                                    }
                                    : undefined
                            }
                            onComplete={(creds) => {
                                setCredentials(creds);
                                setCurrentStep(2);
                            }}
                        />
                    )}

                    {/* Step 2: Additional Config */}
                    {currentStep === 2 && (
                        <AdditionalConfigStep
                            onComplete={(config) => {
                                setAdditionalConfig(config);
                                setCurrentStep(3);
                            }}
                            onSkip={() => {
                                setAdditionalConfig({});
                                setCurrentStep(3);
                            }}
                        />
                    )}

                    {/* Step 3: DB Initialization — Already Complete (and owner exists) */}
                    {currentStep === 3 && tenantIsActive && !tenantNeedsOwner && (
                        <div className="space-y-6">
                            <div className="rounded-lg p-6 border bg-green-500/10 border-green-500/20 text-center">
                                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold">
                                    Already Set Up!
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your backend for{" "}
                                    <span className="font-mono font-medium">
                                        {orgSlug}
                                    </span>{" "}
                                    is already configured and ready.
                                </p>
                            </div>
                            <Button
                                onClick={() =>
                                    router.push(`/${orgSlug}/sign-in`)
                                }
                                className="w-full"
                                size="lg"
                            >
                                Go to Sign In →
                            </Button>
                        </div>
                    )}

                    {/* Step 3: DB Initialization — Running */}
                    {currentStep === 3 && credentials && !tenantIsActive && (
                        <DbInitProgress
                            orgSlug={orgSlug}
                            envVars={fullEnvVars}
                            onComplete={() => {
                                setCurrentStep(4);
                            }}
                        />
                    )}

                    {/* Step 4: Create Owner Account */}
                    {currentStep === 4 && (
                        <OwnerAccountStep orgSlug={orgSlug} orgName={orgName || orgSlug} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
