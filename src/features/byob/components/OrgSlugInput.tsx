"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMemo } from "react";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { registerSchema, RESERVED_SLUGS } from "../schemas";
import { useBYOBRegister } from "../api/use-byob-register";
import { useBYOBTenant } from "../api/use-byob-tenant";
import { generateSlugSuggestions } from "../utils/slug-suggestions";

interface OrgSlugInputProps {
    onComplete: (orgSlug: string, orgName: string) => void;
    defaultSlug?: string;
}

export const OrgSlugInput = ({ onComplete, defaultSlug }: OrgSlugInputProps) => {
    const { mutate, isPending } = useBYOBRegister();

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            orgSlug: defaultSlug || "",
            orgName: "",
        },
    });

    const slug = form.watch("orgSlug");
    const { data: existingTenant, isLoading: isCheckingSlug } = useBYOBTenant(slug);
    const slugTaken = existingTenant && "success" in existingTenant && existingTenant.success;
    const slugReserved = slug.length >= 3 && RESERVED_SLUGS.has(slug);

    // Generate suggestions only when slug is taken
    const suggestions = useMemo(() => {
        if (!slugTaken || slug.length < 3) return [];
        return generateSlugSuggestions(slug, 5);
    }, [slugTaken, slug]);

    const onSubmit = (values: z.infer<typeof registerSchema>) => {
        mutate(
            { json: values },
            {
                onSuccess: (data) => {
                    if ("success" in data && data.success) {
                        onComplete(values.orgSlug, values.orgName);
                    }
                },
            }
        );
    };

    const selectSuggestion = (suggested: string) => {
        form.setValue("orgSlug", suggested, { shouldValidate: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold">Create Your Organisation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Choose a unique slug for your organisation. This will be used in your
                    sign-in URL: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        app.fairlx.com/your-slug/sign-in
                    </code>
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="orgSlug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organisation Slug</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="my-company"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(
                                                    e.target.value
                                                        .toLowerCase()
                                                        .replace(/[^a-z0-9-]/g, "")
                                                );
                                            }}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {isCheckingSlug && (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                            {!isCheckingSlug && slug.length >= 3 && (slugTaken || slugReserved) && (
                                                <XCircle className="h-4 w-4 text-destructive" />
                                            )}
                                            {!isCheckingSlug && slug.length >= 3 && !slugTaken && !slugReserved && (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                </FormControl>

                                {/* Reserved slug message */}
                                {slugReserved && (
                                    <p className="text-sm text-destructive">
                                        This slug is reserved. Please choose a different name.
                                    </p>
                                )}

                                {/* Taken message + suggestions */}
                                {slugTaken && !slugReserved && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-destructive">
                                            This slug is already taken
                                        </p>
                                        {suggestions.length > 0 && (
                                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3" />
                                                    Try one of these instead:
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {suggestions.map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => selectSuggestion(s)}
                                                            className="text-xs px-2.5 py-1 rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Available message */}
                                {!isCheckingSlug && slug.length >= 3 && !slugTaken && (
                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span className="font-mono text-xs">{slug}</span> is available!
                                    </p>
                                )}

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="orgName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organisation Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="My Company Inc."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={isPending || !!slugTaken}
                        className="w-full"
                        size="lg"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Create Organisation
                    </Button>
                </form>
            </Form>
        </div>
    );
};
