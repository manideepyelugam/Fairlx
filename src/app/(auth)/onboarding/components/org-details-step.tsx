"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, AlertTriangle, Mail } from "lucide-react";
import { toast } from "sonner";

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
        } catch {
            toast.error("Failed to send verification email. Please try again.");
        } finally {
            setIsResendingVerification(false);
        }
    };

    const onSubmit = async (values: OrganizationForm) => {
        if (!isEmailVerified) {
            toast.error("Please verify your email before creating an organization.");
            return;
        }

        setIsSubmitting(true);

        try {
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

            await queryClient.invalidateQueries({ queryKey: ["current"] });

            toast.success("Organization created!");
            onOrgCreated(organization.$id, values.name);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create organization");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Email verification required
    if (!isEmailVerified) {
        return (
            <div className="w-full">
                <div className="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-500/15 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Email verification required
                </h1>
                <p className="mt-2 text-muted-foreground text-sm sm:text-base">
                    You must verify your email address before creating an organization.
                </p>

                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.email}</p>
                            <p className="text-xs text-muted-foreground">Unverified</p>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
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
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
        

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Set up your organization
            </h1>
            <p className="mt-2 text-muted-foreground text-xs sm:text-sm">
                Create your organization to start collaborating with your team.
            </p>

            <div className="mt-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-medium">Organization Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Acme Corporation"
                                            disabled={isSubmitting}
                                            className="h-10 text-xs"
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
                                    <FormLabel className="text-xs font-medium">Organization Size (optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-10 text-xs">
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
                            className="w-full h-10 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
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
            </div>
        </div>
    );
}
