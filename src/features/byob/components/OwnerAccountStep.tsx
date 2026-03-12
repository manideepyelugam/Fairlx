"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { LegalAcceptance } from "@/features/auth/components/legal-acceptance";
import { useBYOBCreateOwnerAccount } from "../api/use-byob-create-owner-account";

const schema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    acceptedTerms: z.literal(true, {
        errorMap: () => ({ message: "You must accept the Terms of Service" }),
    }),
    acceptedDPA: z.literal(true, {
        errorMap: () => ({ message: "You must accept the Data Processing Agreement" }),
    }),
});

type FormValues = z.infer<typeof schema>;

interface OwnerAccountStepProps {
    orgSlug: string;
    orgName: string;
}

export const OwnerAccountStep = ({ orgSlug, orgName }: OwnerAccountStepProps) => {
    const { mutate, isPending } = useBYOBCreateOwnerAccount();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            acceptedTerms: false as unknown as true,
            acceptedDPA: false as unknown as true,
        },
    });

    const acceptedTerms = form.watch("acceptedTerms");
    const acceptedDPA = form.watch("acceptedDPA");

    const onSubmit = (values: FormValues) => {
        mutate({
            orgSlug,
            name: values.name,
            email: values.email,
            password: values.password,
            acceptedTerms: true,
            acceptedDPA: true,
        });
    };

    return (
        <div className="space-y-5">
            {/* Context banner */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        You are the owner of <span className="font-mono">{orgName}</span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        These credentials give you full administrative access. After
                        verifying your email, sign in at{" "}
                        <span className="font-mono">/{orgSlug}/sign-in</span> and add
                        your team from within the app.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Jane Smith"
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name="email"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="jane@yourcompany.com"
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name="password"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <PasswordInput
                                        placeholder="At least 8 characters"
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <LegalAcceptance
                        acceptedTerms={acceptedTerms}
                        acceptedDPA={acceptedDPA}
                        onAcceptedTermsChange={(v) =>
                            form.setValue("acceptedTerms", v as true, { shouldValidate: true })
                        }
                        onAcceptedDPAChange={(v) =>
                            form.setValue("acceptedDPA", v as true, { shouldValidate: true })
                        }
                        disabled={isPending}
                    />

                    <Button
                        type="submit"
                        disabled={isPending || !acceptedTerms || !acceptedDPA}
                        size="lg"
                        className="w-full"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create Owner Account & Finish"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
};
