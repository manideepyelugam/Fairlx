"use client";

import { useState } from "react";
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

interface OrgWorkspaceStepProps {
    currentStep: number;
    totalSteps: number;
    organizationId: string;
    organizationName: string;
    onWorkspaceCreated: (workspaceId: string) => void;
    onSkip: () => void;
}

const workspaceSchema = z.object({
    name: z.string().min(2, "Workspace name must be at least 2 characters"),
});

type WorkspaceForm = z.infer<typeof workspaceSchema>;

/**
 * Organization Account: Workspace Creation Step (Optional)
 * 
 * Creates a workspace with:
 * - ownerType: "ORG"
 * - ownerId: organizationId
 * 
 * User can skip this step (zero-workspace state is valid for orgs).
 */
export function OrgWorkspaceStep({
    organizationName,
    onWorkspaceCreated,
    onSkip,
}: OrgWorkspaceStepProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const form = useForm<WorkspaceForm>({
        resolver: zodResolver(workspaceSchema),
        defaultValues: {
            name: "",
        },
    });

    const onSubmit = async (values: WorkspaceForm) => {
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

            const result = await response.json();
            const workspaceId = result.data?.$id;

            if (!workspaceId) {
                throw new Error("Workspace created but ID not returned");
            }

            // Update prefs to mark onboarding complete
            await fetch("/api/auth/update-prefs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    needsOnboarding: false,
                    signupCompletedAt: new Date().toISOString(),
                    onboardingStep: "COMPLETED",
                }),
                credentials: "include",
            });

            // Invalidate cache
            await queryClient.invalidateQueries({ queryKey: ["current"] });
            await queryClient.invalidateQueries({ queryKey: ["workspaces"] });

            toast.success("Workspace created!");

            onWorkspaceCreated(workspaceId);
        } catch (error) {
            console.error("Workspace creation error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create workspace");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        try {
            // Update prefs to mark onboarding complete (no workspace)
            await fetch("/api/auth/update-prefs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    needsOnboarding: false,
                    signupCompletedAt: new Date().toISOString(),
                    onboardingStep: "COMPLETED",
                }),
                credentials: "include",
            });

            await queryClient.invalidateQueries({ queryKey: ["current"] });

            onSkip();
        } catch (error) {
            console.error("Skip error:", error);
            // Still continue even if prefs update fails
            onSkip();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-lg shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <Folder className="h-7 w-7 text-green-600" />
                </div>
                <div className="flex items-center justify-center gap-2">
                    <CardTitle className="text-2xl">{organizationName} is Ready! 🎉</CardTitle>
                </div>
                <div className="flex justify-center mt-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        Optional Step
                    </span>
                </div>
                <CardDescription className="mt-2">
                    Create a workspace to organize your team&apos;s projects, or skip for now.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!showForm ? (
                    <div className="space-y-4">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={() => setShowForm(true)}
                            disabled={isSubmitting}
                        >
                            <Folder className="mr-2 h-4 w-4" />
                            Create Workspace
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full"
                            size="lg"
                            onClick={handleSkip}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Skip for Now
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
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
                                    onClick={() => setShowForm(false)}
                                    disabled={isSubmitting}
                                >
                                    Back
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
                                        "Create"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
