"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface PersonalWorkspaceStepProps {
    currentStep: number;
    totalSteps: number;
    userId: string;
    onWorkspaceCreated: (workspaceId: string) => void;
}

const workspaceSchema = z.object({
    name: z.string().min(2, "Workspace name must be at least 2 characters"),
});

type WorkspaceForm = z.infer<typeof workspaceSchema>;

/**
 * Personal Account: Workspace Creation Step
 * 
 * Creates a workspace with:
 * - ownerType: "PERSONAL"
 * - ownerId: userId
 * 
 * INVARIANT: Personal accounts must have exactly one workspace.
 * Step advances only when workspace creation succeeds.
 */
export function PersonalWorkspaceStep({
    onWorkspaceCreated
}: PersonalWorkspaceStepProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

            // Update prefs to mark account type and signup complete
            await fetch("/api/auth/update-prefs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountType: "PERSONAL",
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

            // Advance step via callback (updates local state)
            onWorkspaceCreated(workspaceId);
        } catch (error) {
            console.error("Workspace creation error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create workspace");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Folder className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Your Workspace</CardTitle>
                <CardDescription>
                    A workspace is where your projects and tasks live.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                                            placeholder="My Workspace"
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Workspace"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
