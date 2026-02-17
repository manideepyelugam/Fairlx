"use client";

import { useState, useEffect } from "react";
import { Shield, Smartphone, Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useVerify2FA } from "@/features/twoFactorAuth/api/use-verify-2fa";
import { useSendEmailOtp } from "@/features/twoFactorAuth/api/use-send-email-otp";
import { TwoFactorMethod } from "@/features/twoFactorAuth/server/types";

const verifySchema = z.object({
    code: z.string().min(6, "Code must be at least 6 characters").max(20), // Support recovery codes too
});

interface TwoFactorChallengeCardProps {
    tempToken: string;
    method: TwoFactorMethod;
    methods?: TwoFactorMethod[];
    email: string;
    onCancel: () => void;
}

export const TwoFactorChallengeCard = ({
    tempToken,
    method: initialMethod,
    methods = [],
    email,
    onCancel
}: TwoFactorChallengeCardProps) => {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [currentMethod, setCurrentMethod] = useState<TwoFactorMethod>(initialMethod);
    const verify = useVerify2FA();

    // We need useSendEmailOtp to trigger it when switching
    const { mutate: sendEmailOtp, isPending: isSendingOtp } = useSendEmailOtp();

    const [hasInitialEmailSent, setHasInitialEmailSent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (initialMethod === TwoFactorMethod.EMAIL && !hasInitialEmailSent) {
            sendEmailOtp({ json: { email, tempToken } });
            setHasInitialEmailSent(true);
            setResendCooldown(60);
        }
    }, [initialMethod, email, sendEmailOtp, hasInitialEmailSent, tempToken]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResendEmail = () => {
        if (resendCooldown > 0 || isSendingOtp) return;
        sendEmailOtp({ json: { email, tempToken } }, {
            onSuccess: () => {
                setResendCooldown(60);
                toast.success("Verification code resent to your email");
            }
        });
    };

    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            code: "",
        },
    });

    const onSubmit = (values: z.infer<typeof verifySchema>) => {
        verify.mutate({
            json: {
                code: values.code,
                tempToken,
                method: isRecoveryMode ? undefined : currentMethod,
                isRecoveryCode: isRecoveryMode,
            }
        });
    };

    const handleSwitchMethod = () => {
        const otherMethod = methods.find(m => m !== currentMethod);
        if (otherMethod) {
            setCurrentMethod(otherMethod);
            if (otherMethod === TwoFactorMethod.EMAIL && resendCooldown === 0) {
                sendEmailOtp({ json: { email, tempToken } });
                setResendCooldown(60);
            }
        }
    };

    const getMethodIcon = () => {
        if (isRecoveryMode) return <Shield className="size-6 text-warning" />;
        return currentMethod === TwoFactorMethod.EMAIL
            ? <Mail className="size-6 text-primary" />
            : <Smartphone className="size-6 text-primary" />;
    };

    const getMethodTitle = () => {
        if (isRecoveryMode) return "Recovery Code";
        return currentMethod === TwoFactorMethod.EMAIL ? "Email Verification" : "Authenticator App";
    };

    const getMethodDescription = () => {
        if (isRecoveryMode) return "Enter one of your backup recovery codes.";
        return currentMethod === TwoFactorMethod.EMAIL
            ? `We've sent a 6-digit code to ${email}`
            : "Enter the 6-digit code from your authenticator app.";
    };

    return (
        <Card className="size-full md:w-[487px] border-none shadow-none">
            <CardHeader className="flex flex-col items-center justify-center text-center p-7">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                    {getMethodIcon()}
                </div>
                <CardTitle className="text-2xl">{getMethodTitle()}</CardTitle>
                <CardDescription className="pt-2">
                    {getMethodDescription()}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-7">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            name="code"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder={isRecoveryMode ? "XXXX-XXXX" : "000000"}
                                            className="text-center text-lg tracking-widest font-mono"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!isRecoveryMode && currentMethod === TwoFactorMethod.EMAIL && (
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                    onClick={handleResendEmail}
                                    disabled={resendCooldown > 0 || isSendingOtp}
                                >
                                    {isSendingOtp ? (
                                        <Loader2 className="size-3 animate-spin mr-2" />
                                    ) : null}
                                    {resendCooldown > 0
                                        ? `Resend code in ${resendCooldown}s`
                                        : "Didn't receive a code? Resend"}
                                </Button>
                            </div>
                        )}

                        <Button disabled={verify.isPending} size="lg" className="w-full">
                            {verify.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            {isRecoveryMode ? "Verify Code" : "Verify and Login"}
                        </Button>
                    </form>
                </Form>

                <div className="mt-6 flex flex-col gap-3">
                    {!isRecoveryMode && methods.length > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:underline h-auto p-0"
                            onClick={handleSwitchMethod}
                        >
                            Use {methods.find(m => m !== currentMethod) === TwoFactorMethod.EMAIL ? "Email" : "Authenticator App"} instead
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => setIsRecoveryMode(!isRecoveryMode)}
                    >
                        {isRecoveryMode ? "Use 2FA Method instead" : "Use a backup recovery code"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={onCancel}
                    >
                        <ArrowLeft className="size-3 mr-2" />
                        Back to Login
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
