"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
                    accountType: "PERSONAL",
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

    return (
        <div className="w-full">


            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Create your workspace
            </h1>
            <p className="mt-4 text-muted-foreground text-xs sm:text-sm">
                A workspace is where your projects and tasks live.
                <br />
                You can create more workspaces later.
            </p>

            <div className="mt-8">
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
                                            placeholder="My Workspace"
                                            disabled={isSubmitting}
                                            className="h-10 text-xs"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            size="sm"
                            className="w-full h-10 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
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
            </div>
        </div>
    );
}
