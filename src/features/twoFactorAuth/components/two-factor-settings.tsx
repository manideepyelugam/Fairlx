"use client";

import { useState } from "react";
import { Shield, Smartphone, Mail, AlertTriangle, Copy, RefreshCw, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useSetupTotp } from "../api/use-setup-totp";
import { useEnableTotp } from "../api/use-enable-totp";
import { useSendEmailOtp } from "../api/use-send-email-otp";
import { useEnableEmailOtp } from "../api/use-enable-email-otp";
import { useDisable2FA } from "../api/use-disable-2fa";
import { useGenerateRecoveryCodes } from "../api/use-generate-recovery-codes";
import { useCurrent } from "@/features/auth/api/use-current";
import Image from "next/image";

import { TwoFactorMethod } from "../server/types";

interface RecoveryCodesData {
    recoveryCodes: string[];
}

interface TwoFactorSettingsProps {
    user: {
        $id: string;
        email: string;
        prefs?: {
            twoFactorEnabled?: boolean;
            twoFactorMethod?: string;
            primaryOrganizationId?: string;
            [key: string]: unknown;
        };
    };
}

export const TwoFactorSettings = ({ user: initialUser }: TwoFactorSettingsProps) => {
    const { data: currentUser } = useCurrent();
    const user = currentUser || initialUser;

    const prefs = user.prefs || {};
    const isEnabled = prefs.twoFactorEnabled || false;
    const currentMethod = prefs.twoFactorMethod as TwoFactorMethod;

    const [isTotpDialogOpen, setIsTotpDialogOpen] = useState(false);
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
    const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);

    const [totpData, setTotpData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [password, setPassword] = useState("");
    const [methodToDisable, setMethodToDisable] = useState<TwoFactorMethod | undefined>(undefined);

    const setupTotp = useSetupTotp();
    const enableTotp = useEnableTotp();
    const sendEmailOtp = useSendEmailOtp();
    const enableEmailOtp = useEnableEmailOtp();
    const disable2fa = useDisable2FA();
    const generateRecoveryCodes = useGenerateRecoveryCodes();

    const handleStartTotpSetup = () => {
        setupTotp.mutate(undefined, {
            onSuccess: (data) => {
                setTotpData(data.data);
                setIsTotpDialogOpen(true);
            }
        });
    };

    const handleVerifyTotp = () => {
        if (verificationCode.length !== 6) {
            toast.error("Please enter a 6-digit code");
            return;
        }
        enableTotp.mutate({
            json: {
                code: verificationCode,
                secret: totpData!.secret
            }
        }, {
            onSuccess: () => {
                setIsTotpDialogOpen(false);
                setVerificationCode("");
                setIsRecoveryDialogOpen(true);
            }
        });
    };

    const handleStartEmailSetup = () => {
        sendEmailOtp.mutate({ json: { email: user.email } }, {
            onSuccess: () => {
                setIsEmailDialogOpen(true);
            }
        });
    };

    const handleVerifyEmail = () => {
        if (verificationCode.length !== 6) {
            toast.error("Please enter a 6-digit code");
            return;
        }
        enableEmailOtp.mutate({
            json: {
                code: verificationCode,
                email: user.email
            }
        }, {
            onSuccess: () => {
                setIsEmailDialogOpen(false);
                setVerificationCode("");
                setIsRecoveryDialogOpen(true);
            }
        });
    };

    const handleDisable = () => {
        if (!password) {
            toast.error("Password is required to disable 2FA");
            return;
        }
        disable2fa.mutate({ json: { password, method: methodToDisable } }, {
            onSuccess: () => {
                setIsDisableDialogOpen(false);
                setPassword("");
                setMethodToDisable(undefined);
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const downloadCodes = (codes: string[]) => {
        const content = `Fairlx Backup Recovery Codes\nGenerated at: ${new Date().toLocaleString()}\n\n${codes.join("\n")}\n\nKeep these codes in a secure place. Each code can only be used once.`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fairlx-recovery-codes-${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Recovery codes downloaded");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Shield className="size-5 text-primary" />
                                Two-Factor Authentication
                            </CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account
                            </CardDescription>
                        </div>
                        <Badge variant={isEnabled ? "outline" : "secondary"} className="h-6">
                            {isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* TOTP Method */}
                        <div className={`p-4 border rounded-lg transition-colors ${currentMethod === TwoFactorMethod.TOTP ? "border-primary bg-primary/5" : "bg-card"}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Smartphone className="size-5 text-primary" />
                                </div>
                                {(currentMethod === TwoFactorMethod.TOTP || currentMethod === TwoFactorMethod.BOTH) && (
                                    <Badge variant="outline" className="text-[10px] uppercase">Active</Badge>
                                )}
                            </div>
                            <h3 className="font-semibold text-sm mb-1">Authenticator App</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Use an app like Google Authenticator or Authy to get security codes.
                            </p>
                            {(!isEnabled || (currentMethod !== TwoFactorMethod.TOTP && currentMethod !== TwoFactorMethod.BOTH)) ? (
                                <Button
                                    variant="outline"
                                    size="xs"
                                    className="w-full text-xs"
                                    onClick={handleStartTotpSetup}
                                    disabled={setupTotp.isPending}
                                >
                                    {setupTotp.isPending ? <Loader2 className="size-3 animate-spin mr-2" /> : null}
                                    Setup Authenticator
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="xs"
                                    className="w-full text-xs text-destructive hover:text-destructive"
                                    onClick={() => {
                                        setMethodToDisable(TwoFactorMethod.TOTP);
                                        setIsDisableDialogOpen(true);
                                    }}
                                >
                                    Disable
                                </Button>
                            )}
                        </div>

                        {/* Email Method */}
                        <div className={`p-4 border rounded-lg transition-colors ${currentMethod === TwoFactorMethod.EMAIL ? "border-primary bg-primary/5" : "bg-card"}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Mail className="size-5 text-primary" />
                                </div>
                                {(currentMethod === TwoFactorMethod.EMAIL || currentMethod === TwoFactorMethod.BOTH) && (
                                    <Badge variant="outline" className="text-[10px] uppercase">Active</Badge>
                                )}
                            </div>
                            <h3 className="font-semibold text-sm mb-1">Email Verification</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Receive security codes via email to your registered address.
                            </p>
                            {(!isEnabled || (currentMethod !== TwoFactorMethod.EMAIL && currentMethod !== TwoFactorMethod.BOTH)) ? (
                                <Button
                                    variant="outline"
                                    size="xs"
                                    className="w-full text-xs"
                                    onClick={handleStartEmailSetup}
                                    disabled={sendEmailOtp.isPending}
                                >
                                    {sendEmailOtp.isPending ? <Loader2 className="size-3 animate-spin mr-2" /> : null}
                                    Setup Email 2FA
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="xs"
                                    className="w-full text-xs text-destructive hover:text-destructive"
                                    onClick={() => {
                                        setMethodToDisable(TwoFactorMethod.EMAIL);
                                        setIsDisableDialogOpen(true);
                                    }}
                                >
                                    Disable
                                </Button>
                            )}
                        </div>
                    </div>

                    {isEnabled && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-medium">Backup Recovery Codes</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Use recovery codes to access your account if you lose your 2FA device.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="xs"
                                        className="text-xs"
                                        onClick={() => {
                                            generateRecoveryCodes.mutate(undefined, {
                                                onSuccess: () => setIsRecoveryDialogOpen(true)
                                            });
                                        }}
                                        disabled={generateRecoveryCodes.isPending}
                                    >
                                        {generateRecoveryCodes.isPending ? <Loader2 className="size-3 animate-spin mr-2" /> : <RefreshCw className="size-3 mr-2" />}
                                        Regenerate Codes
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* TOTP Setup Dialog */}
            <Dialog open={isTotpDialogOpen} onOpenChange={setIsTotpDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Setup Authenticator App</DialogTitle>
                        <DialogDescription>
                            Scan the QR code with your authenticator app.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-4 space-y-6">
                        <div className="bg-white p-2 rounded-lg border">
                            {totpData && (
                                <Image src={totpData.qrCodeUrl} alt="QR Code" width={192} height={192} className="size-48" />
                            )}
                        </div>
                        <div className="w-full space-y-2">
                            <Label className="text-xs">Or enter this secret manually:</Label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 p-2 bg-muted rounded text-xs break-all font-mono">
                                    {totpData?.secret}
                                </code>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(totpData?.secret || "")}>
                                    <Copy className="size-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="w-full space-y-2 pt-4">
                            <Label htmlFor="code">Enter the 6-digit code from your app</Label>
                            <Input
                                id="code"
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                maxLength={6}
                                className="text-center text-lg tracking-[1em]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTotpDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleVerifyTotp} disabled={enableTotp.isPending}>
                            {enableTotp.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            Verify and Enable
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Setup Dialog */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Verify Your Email</DialogTitle>
                        <DialogDescription>
                            We&apos;ve sent a 6-digit code to <strong>{user.email}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-code">Verification Code</Label>
                            <Input
                                id="email-code"
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                maxLength={6}
                                className="text-center text-lg tracking-[1em]"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Didn&apos;t receive a code? <button className="text-primary hover:underline" onClick={handleStartEmailSetup}>Resend</button>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleVerifyEmail} disabled={enableEmailOtp.isPending}>
                            {enableEmailOtp.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            Verify and Enable
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Recovery Codes Dialog */}
            <Dialog open={isRecoveryDialogOpen} onOpenChange={setIsRecoveryDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-warning" />
                            Recovery Codes
                        </DialogTitle>
                        <DialogDescription>
                            Save these codes in a secure place. If you lose access to your 2FA method, you can use these to sign in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted/50 rounded-lg">
                        {(generateRecoveryCodes.data && 'data' in generateRecoveryCodes.data ? generateRecoveryCodes.data.data.recoveryCodes : []).map((code: string) => (
                            <div key={code} className="p-2 border bg-card rounded text-center font-mono text-sm">
                                {code}
                            </div>
                        ))}
                        {(!generateRecoveryCodes.data && enableTotp.data && 'data' in enableTotp.data ? (enableTotp.data.data as RecoveryCodesData).recoveryCodes : []).map((code: string) => (
                            <div key={code} className="p-2 border bg-card rounded text-center font-mono text-sm">
                                {code}
                            </div>
                        ))}
                        {(!generateRecoveryCodes.data && !enableTotp.data && enableEmailOtp.data && 'data' in enableEmailOtp.data ? (enableEmailOtp.data.data as RecoveryCodesData).recoveryCodes : []).map((code: string) => (
                            <div key={code} className="p-2 border bg-card rounded text-center font-mono text-sm">
                                {code}
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex gap-3">
                        <AlertTriangle className="size-5 text-warning shrink-0" />
                        <p className="text-xs text-warning-foreground">
                            These codes will only be shown once. Please copy or download them now.
                        </p>
                    </div>
                    <DialogFooter className="sm:justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="xs" onClick={() => copyToClipboard(
                                (generateRecoveryCodes.data && 'data' in generateRecoveryCodes.data ? generateRecoveryCodes.data.data.recoveryCodes :
                                    enableTotp.data && 'data' in enableTotp.data ? (enableTotp.data.data as RecoveryCodesData).recoveryCodes :
                                        enableEmailOtp.data && 'data' in enableEmailOtp.data ? (enableEmailOtp.data.data as RecoveryCodesData).recoveryCodes : []).join("\n")
                            )}>
                                <Copy className="size-3 mr-2" />
                                Copy All
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => downloadCodes(
                                (generateRecoveryCodes.data && 'data' in generateRecoveryCodes.data ? generateRecoveryCodes.data.data.recoveryCodes :
                                    enableTotp.data && 'data' in enableTotp.data ? (enableTotp.data.data as RecoveryCodesData).recoveryCodes :
                                        enableEmailOtp.data && 'data' in enableEmailOtp.data ? (enableEmailOtp.data.data as RecoveryCodesData).recoveryCodes : [])
                            )}>
                                <Download className="size-3 mr-2" />
                                Download
                            </Button>
                        </div>
                        <Button onClick={() => setIsRecoveryDialogOpen(false)}>I&apos;ve Saved Them</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disable 2FA Dialog */}
            <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            For your security, please enter your password to disable 2FA.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="disable-password">Account Password</Label>
                            <Input
                                id="disable-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDisableDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDisable} disabled={disable2fa.isPending}>
                            {disable2fa.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                            Disable {methodToDisable === TwoFactorMethod.TOTP ? "Authenticator" : methodToDisable === TwoFactorMethod.EMAIL ? "Email 2FA" : "2FA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
