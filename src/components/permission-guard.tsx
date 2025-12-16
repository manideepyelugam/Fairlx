"use client";

import { usePermission } from "@/hooks/use-permission";
import { ReactNode } from "react";

interface PermissionGuardProps {
    permission: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export const PermissionGuard = ({ permission, children, fallback = null }: PermissionGuardProps) => {
    const { can, isLoading } = usePermission();

    // We could show a loading state here, but for buttons it's usually better to hide 
    // until we know (or disable). 
    // If fallback is provided, render it when checking fails or loading?
    // Usually we wait for loading to finish.
    if (isLoading) return null;

    if (!can(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
