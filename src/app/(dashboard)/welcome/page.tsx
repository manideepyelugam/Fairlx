"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Circle, Building2, FolderPlus, Settings, User, Clock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrent } from "@/features/auth/api/use-current";
import { useAccountLifecycle } from "@/components/account-lifecycle-provider";
import { useCreateWorkspaceModal } from "@/features/workspaces/hooks/use-create-workspace-modal";

interface ProgressStep {
    label: string;
    complete: boolean;
}

const ProgressBar = ({ steps }: { steps: ProgressStep[] }) => {
    const completedCount = steps.filter(s => s.complete).length;
    const percentage = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>Account Setup Progress</span>
                <span>{percentage}% complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex flex-wrap gap-4">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        {step.complete ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={step.complete ? "text-foreground" : "text-muted-foreground"}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Restricted Welcome View for ORG members without workspace assignment.
 * Shows holding state with profile completion option.
 */
const RestrictedWelcome = ({ userName, orgRole }: { userName?: string; orgRole: string | null }) => {
    const router = useRouter();

    const roleDisplay = orgRole === "ADMIN" ? "Admin" : orgRole === "MODERATOR" ? "Moderator" : "Member";

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
            <div className="w-full max-w-lg space-y-8">
                {/* Welcome Header */}
                <div className="text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">
                        Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!
                    </h1>
                    <Badge variant="secondary" className="text-sm">
                        {roleDisplay}
                    </Badge>
                </div>

                {/* Waiting State Card */}
                <Card className="border-2 border-dashed">
                    <CardHeader className="text-center">
                        <CardTitle>Waiting for Workspace Access</CardTitle>
                        <CardDescription className="text-base">
                            You&apos;ll get full access once an admin assigns you to a workspace.
                            In the meantime, you can complete your profile.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Profile Setup CTA */}
                <Card className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => router.push("/profile")}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Complete Your Profile</CardTitle>
                                <CardDescription>
                                    Add your photo, timezone, and preferences
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" size="lg">
                            Set Up Profile
                        </Button>
                    </CardContent>
                </Card>

                {/* Help Text */}
                <p className="text-center text-sm text-muted-foreground">
                    Need help? Contact your organization administrator.
                </p>
            </div>
        </div>
    );
};

export default function WelcomePage() {
    const router = useRouter();
    const { data: user } = useCurrent();
    const { isOrg, isRestrictedOrgMember, lifecycleState } = useAccountLifecycle();
    const { open: openCreateWorkspace } = useCreateWorkspaceModal();

    const prefs = user?.prefs || {};
    const orgSetupComplete = prefs.orgSetupComplete === true;

    // ============================================================
    // RESTRICTED MODE: Show holding state for non-OWNER without workspace
    // ============================================================
    if (isRestrictedOrgMember) {
        return <RestrictedWelcome userName={user?.name} orgRole={lifecycleState.orgRole} />;
    }

    // Build progress steps based on account type (for OWNER / PERSONAL)
    const progressSteps: ProgressStep[] = [
        { label: "Account created", complete: true },
        { label: "Email verified", complete: user?.emailVerification === true },
        ...(isOrg ? [{ label: "Organization setup", complete: orgSetupComplete }] : []),
        { label: "Workspace created", complete: false }, // We're on this page because no workspace
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
            <div className="w-full max-w-2xl space-y-8">
                {/* Welcome Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">
                        Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 🎉
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Your account is ready. Let&apos;s set up your first workspace.
                    </p>
                </div>

                {/* Progress Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <ProgressBar steps={progressSteps} />
                    </CardContent>
                </Card>

                {/* Action Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Create Workspace - Primary CTA */}
                    <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={openCreateWorkspace}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <FolderPlus className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Create Workspace</CardTitle>
                                    <CardDescription>
                                        Start collaborating with your team
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" size="lg">
                                Create Your First Workspace
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Conditional: Manage Organization (ORG) or Manage Account (PERSONAL) */}
                    {isOrg ? (
                        <Card
                            className="hover:border-muted-foreground/30 transition-colors cursor-pointer"
                            onClick={() => router.push("/organization")}
                        >
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <Building2 className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Manage Organization</CardTitle>
                                        <CardDescription>
                                            View billing, members, and settings
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push("/organization");
                                    }}
                                >
                                    Organization Settings
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="hover:border-muted-foreground/30 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <Settings className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Manage Account</CardTitle>
                                        <CardDescription>
                                            Update your profile and preferences
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                    onClick={() => router.push("/profile")}
                                >
                                    Account Settings
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-muted-foreground">
                    A workspace is where you organize your projects, tasks, and team collaboration.
                    You can create multiple workspaces later.
                </p>
            </div>
        </div>
    );
}

