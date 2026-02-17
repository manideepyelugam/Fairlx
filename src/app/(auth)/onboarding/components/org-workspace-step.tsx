"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Folder, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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
            await queryClient.invalidateQueries({ queryKey: ["workspaces"] });

            toast.success("Workspace created!");
            onWorkspaceCreated(workspaceId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create workspace");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        try {
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
        } catch {
            onSkip();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            {/* Icon */}
    
  <span className="inline-block mb-3 ml-[-5px] text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                Optional Step
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {organizationName} is ready! 🎉
            </h1>
          
            <p className="mt-2 text-muted-foreground text-xs sm:text-sm">
                Create a workspace to organize your team&apos;s projects, or skip for now.
            </p>

            <div className="mt-8">
                {!showForm ? (
                    <div className="space-y-3">
                        <Button
                            className="w-full h-10 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setShowForm(true)}
                            disabled={isSubmitting}
                        >
                            Create Workspace
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full h-10 text-xs"
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
                                        <FormLabel className="text-sm font-medium">Workspace Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Engineering, Marketing, etc."
                                                disabled={isSubmitting}
                                                className="h-12 text-base"
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
                                    className="flex-1 h-12"
                                    onClick={() => setShowForm(false)}
                                    disabled={isSubmitting}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
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
            </div>
        </div>
    );
}
