"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, AlertTriangle, Mail } from "lucide-react";
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
import { useCurrent } from "@/features/auth/api/use-current";

interface OrgDetailsStepProps {
    currentStep: number;
    totalSteps: number;
    onOrgCreated: (organizationId: string, organizationName: string) => void;
}

const organizationSchema = z.object({
    name: z.string().min(2, "Organization name must be at least 2 characters"),
    size: z.string().optional(),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

const ORGANIZATION_SIZES = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "500+", label: "500+ employees" },
];

/**
 * Organization Account: Organization Details Step
 * 
 * ENTERPRISE SECURITY: Blocks org creation if email is not verified.
 * Creates an organization with the user as OWNER.
 * Step advances only when organization creation succeeds.
 */
export function OrgDetailsStep({
    onOrgCreated
}: OrgDetailsStepProps) {
    const queryClient = useQueryClient();
    const { data: user } = useCurrent();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResendingVerification, setIsResendingVerification] = useState(false);

    const form = useForm<OrganizationForm>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: "",
            size: "",
        },
    });

    // ENTERPRISE: Check email verification status
    const isEmailVerified = user?.emailVerification === true;

    const handleResendVerification = async () => {
        setIsResendingVerification(true);
        try {
            const response = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user?.email }),
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to send verification email");
            }

            toast.success("Verification email sent!", {
                description: "Please check your inbox and verify your email.",
            });
        } catch (error) {
            console.error("Resend verification error:", error);
            toast.error("Failed to send verification email. Please try again.");
        } finally {
            setIsResendingVerification(false);
        }
    };

    const onSubmit = async (values: OrganizationForm) => {
        // ENTERPRISE: Double-check verification before submission
        if (!isEmailVerified) {
            toast.error("Please verify your email before creating an organization.");
            return;
        }

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

            if (!organization?.$id) {
                throw new Error("Organization created but ID not returned");
            }

            // Update user prefs to mark org setup complete
            await fetch("/api/auth/update-prefs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountType: "ORG",
                    orgSetupComplete: true,
                    primaryOrganizationId: organization.$id,
                    organizationSize: values.size || null,
                }),
                credentials: "include",
            });

            // Invalidate cache
            await queryClient.invalidateQueries({ queryKey: ["current"] });

            toast.success("Organization created!");

            // Advance step via callback
            onOrgCreated(organization.$id, values.name);
        } catch (error) {
            console.error("Organization creation error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create organization");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ENTERPRISE: Show verification required message if email not verified
    if (!isEmailVerified) {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                        <AlertTriangle className="h-7 w-7 text-yellow-600" />
                    </div>
                    <CardTitle className="text-2xl">Email Verification Required</CardTitle>
                    <CardDescription>
                        You must verify your email address before creating an organization.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="font-medium">{user?.email}</p>
                            <p className="text-sm text-muted-foreground">Unverified</p>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                    >
                        {isResendingVerification ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend Verification Email
                            </>
                        )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        After verifying your email, refresh this page to continue.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
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
    );
}
