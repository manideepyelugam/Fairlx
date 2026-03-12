"use client";

import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DottedSeparator } from "@/components/dotted-separator";

import { SignInCard } from "@/features/auth/components/sign-in-card";
import { useBYOBTenant } from "@/features/byob/api/use-byob-tenant";

const BYOBSignInPage = () => {
    const params = useParams<{ orgSlug: string }>();
    const searchParams = useSearchParams();
    const orgSlug = params.orgSlug;
    const justRegistered = searchParams.get("registered") === "1";

    const { data, isLoading, error } = useBYOBTenant(orgSlug);

    // Loading state
    if (isLoading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Resolving organisation...
                    </p>
                </div>
            </main>
        );
    }

    // Org not found
    if (error || !data || !("success" in data) || !data.success) {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-screen-2xl p-4">
                    <nav className="flex justify-between items-center">
                        <Link href="/">
                            <Image
                                src="/Logo.png"
                                alt="Fairlx"
                                width={50}
                                height={39}
                            />
                        </Link>
                    </nav>
                    <div className="flex flex-col items-center justify-center pt-14">
                        <Card className="w-full max-w-md border-none shadow-none">
                            <CardContent className="flex flex-col items-center gap-4 p-8">
                                <AlertCircle className="h-12 w-12 text-destructive" />
                                <h2 className="text-xl font-semibold">
                                    Organisation not found
                                </h2>
                                <p className="text-sm text-muted-foreground text-center">
                                    The organisation{" "}
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                        {orgSlug}
                                    </code>{" "}
                                    doesn&apos;t exist or hasn&apos;t been set up yet.
                                </p>
                                <div className="flex gap-3 mt-2">
                                    <Link
                                        href="/sign-in"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Sign in with Fairlx Cloud
                                    </Link>
                                    <span className="text-muted-foreground">•</span>
                                    <Link
                                        href={`/setup/${orgSlug}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Set up this org
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    // Tenant found — show sign-in with org context
    const tenantInfo = data as {
        orgSlug: string;
        orgName: string;
        appwriteEndpoint: string;
        appwriteProject: string;
        status: string;
    };

    // Not yet active
    if (tenantInfo.status !== "ACTIVE") {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-screen-2xl p-4">
                    <nav className="flex justify-between items-center">
                        <Link href="/">
                            <Image
                                src="/Logo.png"
                                alt="Fairlx"
                                width={50}
                                height={39}
                            />
                        </Link>
                    </nav>
                    <div className="flex flex-col items-center justify-center pt-14">
                        <Card className="w-full max-w-md border-none shadow-none">
                            <CardHeader className="text-center">
                                <CardTitle>Setup in progress</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    <strong>{tenantInfo.orgName}</strong> is
                                    still being set up. Please wait for the
                                    admin to complete the setup process.
                                </p>
                                <Link
                                    href={`/setup/${orgSlug}`}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Go to setup page →
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    // Active — show sign-in form
    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-screen-2xl p-4">
                <nav className="flex justify-between items-center">
                    <Link href="/">
                        <Image
                            src="/Logo.png"
                            alt="Fairlx"
                            width={50}
                            height={39}
                        />
                    </Link>
                    <Link
                        href="/sign-in"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        Sign in with Fairlx Cloud instead
                    </Link>
                </nav>
                <div className="flex flex-col items-center justify-center pt-4 md:pt-14">
                    {/* Org Banner */}
                    <div className="mb-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Signing in to
                        </p>
                        <h2 className="text-lg font-semibold">
                            {tenantInfo.orgName}
                        </h2>
                    </div>

                    <DottedSeparator className="mb-4 max-w-[487px]" />

                    {/* Registration success banner */}
                    {justRegistered && (
                        <div className="mb-4 max-w-[487px] w-full rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 px-4 py-3 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-800 dark:text-green-200">
                                Account created! Please check your email to verify, then sign in below.
                            </p>
                        </div>
                    )}

                    {/* Reuse the existing SignInCard */}
                    <SignInCard byobOrgSlug={orgSlug} />
                </div>
            </div>
        </main>
    );
};

export default BYOBSignInPage;
