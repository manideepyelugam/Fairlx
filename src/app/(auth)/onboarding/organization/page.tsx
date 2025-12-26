"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OnboardingStepper, OnboardingStep } from "@/components/onboarding-stepper";
import { useCurrent } from "@/features/auth/api/use-current";

const organizationSetupSchema = z.object({
    name: z.string().min(2, "Organization name must be at least 2 characters"),
    size: z.string().optional(),
});

type OrganizationSetupForm = z.infer<typeof organizationSetupSchema>;

const ORGANIZATION_SIZES = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "500+", label: "500+ employees" },
];

export default function OrganizationSetupPage() {
    const router = useRouter();
    const { data: user, isLoading: isUserLoading } = useCurrent();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const prefs = user?.prefs || {};
    const pendingOrgName = prefs.pendingOrganizationName as string || "";

    const form = useForm<OrganizationSetupForm>({
        resolver: zodResolver(organizationSetupSchema),
        defaultValues: {
            name: pendingOrgName,
            size: "",
        },
    });

    // Handle redirects in useEffect to avoid React render warnings
    useEffect(() => {
        if (isUserLoading) return;

        // Redirect if not ORG account
        if (prefs.accountType !== "ORG") {
            setIsRedirecting(true);
            router.push("/");
            return;
        }

        // Redirect if already setup
        if (prefs.orgSetupComplete) {
            setIsRedirecting(true);
            router.push("/onboarding/workspace");
            return;
        }
    }, [isUserLoading, prefs.accountType, prefs.orgSetupComplete, router]);

    const onSubmit = async (values: OrganizationSetupForm) => {
        setIsSubmitting(true);

        try {
            // Create organization via API
            const formData = new FormData();
            formData.append("name", values.name);

            const response = await fetch("/api/organizations", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to create organization");
            }

            const { data: organization } = await response.json();

            // Update user prefs to mark org setup complete
            const prefsResponse = await fetch("/api/auth/update-prefs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgSetupComplete: true,
                    primaryOrganizationId: organization.$id,
                    organizationSize: values.size || null,
                    onboardingStep: "ORG_SETUP_COMPLETED",
                }),
                credentials: "include",
            });

            if (!prefsResponse.ok) {
                console.error("Failed to update prefs, but org was created");
            }

            toast.success("Organization created!", {
                description: "Your organization is ready.",
            });

            // Redirect to workspace setup
            router.push("/onboarding/workspace");
        } catch (error) {
            console.error("Organization setup error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create organization");
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
                    currentStep={OnboardingStep.ORG_SETUP}
                    accountType="ORG"
                />
            </div>

            {/* Setup Card */}
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Set Up Your Organization</CardTitle>
                    <CardDescription>
                        Create your organization to start collaborating with your team.
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
                                        <FormLabel>Organization Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Acme Corporation"
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organization Size (optional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isSubmitting}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select size" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ORGANIZATION_SIZES.map((size) => (
                                                    <SelectItem key={size.value} value={size.value}>
                                                        {size.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        Creating Organization...
                                    </>
                                ) : (
                                    "Create Organization"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
