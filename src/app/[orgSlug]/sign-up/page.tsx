"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle, Building2 } from "lucide-react";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LegalAcceptance } from "@/features/auth/components/legal-acceptance";

import { useBYOBTenant } from "@/features/byob/api/use-byob-tenant";
import { useBYOBRegisterMember } from "@/features/byob/api/use-byob-register-member";

// ─── Schema ───────────────────────────────────────────────────────────────────

const signUpSchema = z.object({
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

type SignUpValues = z.infer<typeof signUpSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BYOBSignUpPage() {
    const params = useParams<{ orgSlug: string }>();
    const orgSlug = params.orgSlug;

    const { data, isLoading, error } = useBYOBTenant(orgSlug);

    // Loading
    if (isLoading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Resolving organisation...</p>
                </div>
            </main>
        );
    }

    // Org not found
    if (error || !data || !("success" in data) || !data.success) {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-screen-2xl p-4">
                    <nav><Link href="/"><Image src="/Logo.png" alt="Fairlx" width={50} height={39} /></Link></nav>
                    <div className="flex flex-col items-center justify-center pt-14">
                        <Card className="w-full max-w-md border-none shadow-none">
                            <CardContent className="flex flex-col items-center gap-4 p-8">
                                <AlertCircle className="h-12 w-12 text-destructive" />
                                <h2 className="text-xl font-semibold">Organisation not found</h2>
                                <p className="text-sm text-muted-foreground text-center">
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{orgSlug}</code>{" "}
                                    doesn&apos;t exist or hasn&apos;t been set up yet.
                                </p>
                                <div className="flex gap-3">
                                    <Link href="/sign-up" className="text-sm text-blue-600 hover:underline">
                                        Sign up for Fairlx Cloud
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    const tenantInfo = data as {
        orgSlug: string; orgName: string;
        appwriteEndpoint: string; appwriteProject: string; status: string;
    };

    // Org not active yet
    if (tenantInfo.status !== "ACTIVE") {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-screen-2xl p-4">
                    <nav><Link href="/"><Image src="/Logo.png" alt="Fairlx" width={50} height={39} /></Link></nav>
                    <div className="flex flex-col items-center justify-center pt-14">
                        <Card className="w-full max-w-md border-none shadow-none">
                            <CardContent className="flex flex-col items-center gap-4 p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground text-center">
                                    <strong>{tenantInfo.orgName}</strong> is still being set up.
                                    Please contact the administrator.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-screen-2xl p-4">
                <nav className="flex justify-between items-center">
                    <Link href="/"><Image src="/Logo.png" alt="Fairlx" width={50} height={39} /></Link>
                    <Link href={`/${orgSlug}/sign-in`} className="text-sm font-medium border rounded-md px-3 py-1.5 hover:bg-muted transition-colors">
                        Login
                    </Link>
                </nav>
                <div className="flex flex-col items-center justify-center pt-4 md:pt-10">
                    {/* Org banner */}
                    <div className="mb-4 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 mb-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{tenantInfo.orgName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Create your account to join this organisation
                        </p>
                    </div>

                    <DottedSeparator className="mb-6 max-w-[487px]" />

                    <BYOBSignUpForm orgSlug={orgSlug} orgName={tenantInfo.orgName} />
                </div>
            </div>
        </main>
    );
}

// ─── Form Component ───────────────────────────────────────────────────────────

function BYOBSignUpForm({ orgSlug, orgName }: { orgSlug: string; orgName: string }) {
    const { mutate, isPending } = useBYOBRegisterMember();

    const form = useForm<SignUpValues>({
        resolver: zodResolver(signUpSchema),
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
    const isValid = acceptedTerms && acceptedDPA;

    const onSubmit = (values: SignUpValues) => {
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
        <Card className="size-full md:w-[487px] border-none shadow-none">
            <CardHeader className="flex items-center justify-center text-center p-7">
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>
                    Join <strong>{orgName}</strong> on Fairlx
                </CardDescription>
            </CardHeader>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            name="name"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter your name"
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
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="Enter your email address"
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
                                    <FormControl>
                                        <PasswordInput
                                            placeholder="Enter your password"
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
                            onAcceptedTermsChange={(checked) =>
                                form.setValue("acceptedTerms", checked as true, { shouldValidate: true })
                            }
                            onAcceptedDPAChange={(checked) =>
                                form.setValue("acceptedDPA", checked as true, { shouldValidate: true })
                            }
                            disabled={isPending}
                        />

                        <Button
                            type="submit"
                            disabled={isPending || !isValid}
                            size="lg"
                            className="w-full"
                        >
                            {isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7 flex items-center justify-center">
                <p>
                    Already have an account?{" "}
                    <Link href={`/${orgSlug}/sign-in`}>
                        <span className="text-blue-700">Login</span>
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}
