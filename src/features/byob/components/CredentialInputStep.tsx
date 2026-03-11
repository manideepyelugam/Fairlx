"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { validateCredentialsSchema } from "../schemas";
import { useValidateCredentials } from "../api/use-validate-credentials";

interface CredentialInputStepProps {
    onComplete: (credentials: {
        endpoint: string;
        project: string;
        apiKey: string;
    }) => void;
    defaultValues?: {
        endpoint?: string;
        project?: string;
        apiKey?: string;
    };
}

export const CredentialInputStep = ({
    onComplete,
    defaultValues,
}: CredentialInputStepProps) => {
    const { mutate, isPending, data: validationResult } = useValidateCredentials();

    const form = useForm<z.infer<typeof validateCredentialsSchema>>({
        resolver: zodResolver(validateCredentialsSchema),
        defaultValues: {
            endpoint: defaultValues?.endpoint || "",
            project: defaultValues?.project || "",
            apiKey: defaultValues?.apiKey || "",
        },
    });

    const onValidate = (values: z.infer<typeof validateCredentialsSchema>) => {
        mutate(
            { json: values },
            {
                onSuccess: (data) => {
                    // Only auto-advance if valid AND not a free account
                    if ("valid" in data && data.valid && !("isFreeAccount" in data && data.isFreeAccount)) {
                        onComplete(values);
                    }
                },
            }
        );
    };

    const isValid = validationResult && "valid" in validationResult && validationResult.valid;
    const isFreeAccount = validationResult && "isFreeAccount" in validationResult && validationResult.isFreeAccount;
    const planWarning = validationResult && "planWarning" in validationResult ? validationResult.planWarning : undefined;
    const canProceed = isValid && !isFreeAccount;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold">Appwrite Credentials</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Enter your Appwrite instance credentials. We&apos;ll verify the
                    connection before proceeding.
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onValidate)}
                    className="space-y-4"
                >
                    <FormField
                        control={form.control}
                        name="endpoint"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Appwrite Endpoint</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="https://cloud.appwrite.io/v1"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    <a
                                        href="https://appwrite.io/docs/advanced/self-hosting"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        How to find your endpoint
                                    </a>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="project"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project ID</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="your-project-id"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    Found in Appwrite Console → Settings → Project ID
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="standard_abc123..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Create a key with <strong>all scopes</strong> in
                                    Appwrite Console → API Keys
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {validationResult && "error" in validationResult && validationResult.error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span>{validationResult.error}</span>
                        </div>
                    )}

                    {/* Free plan warning */}
                    {isFreeAccount && planWarning && (
                        <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
                            <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Free Plan Detected</p>
                                    <p className="mt-1 text-xs">{planWarning}</p>
                                </div>
                            </div>
                            <a
                                href="https://appwrite.io/pricing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                                <ExternalLink className="h-3 w-3" />
                                View Appwrite Pricing
                            </a>
                        </div>
                    )}

                    {canProceed && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>Credentials validated! Connection successful.</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full"
                        size="lg"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {canProceed ? "Continue →" : "Validate Credentials"}
                    </Button>

                    {/* Allow proceeding despite free plan warning */}
                    {isFreeAccount && isValid && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground"
                            onClick={() => onComplete(form.getValues())}
                        >
                            Proceed anyway (some features may fail)
                        </Button>
                    )}
                </form>
            </Form>
        </div>
    );
};
