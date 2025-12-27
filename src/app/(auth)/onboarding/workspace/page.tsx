"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Folder, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OnboardingStepper, OnboardingStep } from "@/components/onboarding-stepper";
import { useCurrent } from "@/features/auth/api/use-current";

const workspaceSetupSchema = z.object({
    name: z.string().min(2, "Workspace name must be at least 2 characters"),
});

type WorkspaceSetupForm = z.infer<typeof workspaceSetupSchema>;

export default function WorkspaceSetupPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: user, isLoading: isUserLoading } = useCurrent();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const prefs = user?.prefs || {};

    const form = useForm<WorkspaceSetupForm>({
        resolver: zodResolver(workspaceSetupSchema),
        defaultValues: {
            name: "",
        },
    });

    // Handle redirects in useEffect to avoid React render warnings
    useEffect(() => {
        if (isUserLoading) return;

        // Redirect if org not setup (only for ORG accounts)
        if (prefs.accountType === "ORG" && !prefs.orgSetupComplete) {
            setIsRedirecting(true);
            router.push("/onboarding/organization");
            return;
        }

        // PERSONAL accounts: No redirects. They MUST create a workspace here.
    }, [isUserLoading, prefs.accountType, prefs.orgSetupComplete, router]);

    const handleOrgFinishLater = async () => {
        // For Org accounts only: Allows proceeding without a workspace
        try {
            // Update prefs to mark signup as fully complete (since they skipped workspace creation)
            await fetch("/api/auth/update-prefs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    onboardingStep: "COMPLETED",
                }),
                credentials: "include",
            });
            // Invalidate cache before redirect
            await queryClient.invalidateQueries({ queryKey: ["current"] });
            router.push("/");
        } catch (error) {
            console.error("Error finishing setup:", error);
            // Fallback redirect
            router.push("/");
        }
    };

    const onSubmit = async (values: WorkspaceSetupForm) => {
        setIsSubmitting(true);

        try {
            // Create workspace via API
            const formData = new FormData();
            formData.append("name", values.name);

            const response = await fetch("/api/workspaces", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to create workspace");
            }

            // Parse workspace ID from response for immediate redirect
            const result = await response.json();
            const workspaceId = result.data?.$id;

            // Update prefs to mark onboarding complete
            await fetch("/api/auth/update-prefs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    onboardingStep: "COMPLETED",
                }),
                credentials: "include",
            });

            toast.success("Workspace created!", {
                description: "Your setup is complete.",
            });

            // Redirect directly to the new workspace for immediate activation
            if (workspaceId) {
                router.push(`/workspaces/${workspaceId}`);
            } else {
                // Fallback to root (will redirect appropriately)
                router.push("/");
            }
        } catch (error) {
            console.error("Workspace setup error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create workspace");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading state
    if (isUserLoading || isRedirecting) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-muted/30">
            {/* Stepper */}
            <div className="mb-8">
                <OnboardingStepper
                    currentStep={OnboardingStep.WORKSPACE_SETUP}
                    accountType={prefs.accountType || "ORG"}
                />
            </div>

            {/* Setup Card */}
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                        <Folder className="h-7 w-7 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">
                        {prefs.accountType === "ORG" ? "Your Organization is Ready! 🎉" : "Create Your Workspace 🚀"}
                    </CardTitle>
                    <CardDescription>
                        {prefs.accountType === "ORG"
                            ? "Create a workspace to start managing projects, or go to dashboard."
                            : "You need to create a workspace to get started."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!showCreateForm ? (
                        <div className="space-y-4">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() => setShowCreateForm(true)}
                            >
                                <Folder className="mr-2 h-4 w-4" />
                                Create Workspace
                            </Button>

                            {/* Only ORG accounts can proceed without a workspace */}
                            {prefs.accountType === "ORG" && (
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    size="lg"
                                    onClick={handleOrgFinishLater}
                                >
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Workspace Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Engineering, Marketing, etc."
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowCreateForm(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
