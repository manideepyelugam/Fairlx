"use client";

import { ReactNode } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHasOrgPermission } from "../api/use-org-permissions";
import { OrgPermissionKey } from "../types";

interface PermissionGateProps {
    orgId: string | undefined;
    orgMemberId: string | undefined;
    permission: OrgPermissionKey;
    children: ReactNode;
    fallback?: ReactNode;
    showAccessDenied?: boolean;
}

/**
 * Permission Gate Component
 * 
 * Renders children only if user has the required permission.
 * Otherwise renders fallback or access denied message.
 * 
 * RULES:
 * - Permission is checked via useHasOrgPermission hook
 * - OWNER always has all permissions
 * - Shows loading state while checking
 */
export function PermissionGate({
    orgId,
    orgMemberId,
    permission,
    children,
    fallback = null,
    showAccessDenied = false,
}: PermissionGateProps) {
    const { hasPermission, isLoading } = useHasOrgPermission(orgId, orgMemberId, permission);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!hasPermission) {
        if (showAccessDenied) {
            return <AccessDenied permission={permission} />;
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Access Denied Component
 * Shows when user doesn't have required permission
 */
function AccessDenied({ permission }: { permission: OrgPermissionKey }) {
    return (
        <Card className="max-w-md mx-auto mt-12">
            <CardHeader className="text-center">
                <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <Shield className="size-6 text-destructive" />
                </div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                    You don&apos;t have permission to access this resource.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                    Required permission: <code className="bg-muted px-1 rounded">{permission}</code>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Contact your organization owner to request access.
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * Hook to conditionally render based on permission
 */
export function usePermissionCheck(
    orgId: string | undefined,
    orgMemberId: string | undefined,
    permission: OrgPermissionKey
) {
    return useHasOrgPermission(orgId, orgMemberId, permission);
}
