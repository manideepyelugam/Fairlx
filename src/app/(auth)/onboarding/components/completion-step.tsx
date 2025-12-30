"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompletionStepProps {
    accountType: "PERSONAL" | "ORG";
    organizationName?: string;
    workspaceId?: string;
    onComplete: () => void;
}

/**
 * Completion Step
 * 
 * Final step of onboarding - shows success message and enters the app.
 * Clears localStorage onboarding state on completion.
 */
export function CompletionStep({
    accountType,
    organizationName,
    workspaceId,
    onComplete,
}: CompletionStepProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleEnterApp = () => {
        setIsLoading(true);
        onComplete();
    };

    const getMessage = () => {
        if (accountType === "PERSONAL") {
            return "Your personal workspace is ready!";
        }
        if (organizationName && workspaceId) {
            return `${organizationName} and your first workspace are ready!`;
        }
        if (organizationName) {
            return `${organizationName} is ready! You can create workspaces anytime.`;
        }
        return "Your account is ready!";
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">You&apos;re All Set! 🎉</CardTitle>
                <CardDescription>
                    {getMessage()}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Quick tips:</p>
                    <ul className="space-y-1 list-disc list-inside">
                        {accountType === "PERSONAL" ? (
                            <>
                                <li>Create projects to organize your work</li>
                                <li>Use the Kanban board or backlog view</li>
                                <li>Track time on tasks for detailed reports</li>
                            </>
                        ) : (
                            <>
                                <li>Invite team members to collaborate</li>
                                <li>Create workspaces for different teams</li>
                                <li>Set up projects and assign tasks</li>
                            </>
                        )}
                    </ul>
                </div>

                <Button
                    className="w-full"
                    size="lg"
                    onClick={handleEnterApp}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            Enter Fairlx
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
