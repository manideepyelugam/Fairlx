"use client";

import { ReactNode } from "react";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

// Type for member with role (API returns more fields than TypeScript infers)
type MemberWithRole = { role?: string } | null | undefined;

interface ProjectPermissionGuardProps {
    /** The permission key to check (e.g., "project.tasks.create") */
    permission: string;
    /** The project ID to check permissions for */
    projectId: string | null | undefined;
    /** The workspace ID (optional, helps with permission resolution) */
    workspaceId?: string | null;
    /** Content to render if user has permission */
    children: ReactNode;
    /** Fallback content to render if user lacks permission */
    fallback?: ReactNode;
    /** Whether to show nothing while loading (default: true) */
    hideWhileLoading?: boolean;
    /** Loading indicator to show while checking permissions */
    loadingFallback?: ReactNode;
}

/**
 * ProjectPermissionGuard
 * 
 * Conditionally renders children based on user's project-level permissions.
 * 
 * @example
 * ```tsx
 * <ProjectPermissionGuard 
 *   permission="project.tasks.create" 
 *   projectId={projectId}
 * >
 *   <CreateTaskButton />
 * </ProjectPermissionGuard>
 * ```
 * 
 * @example
 * With fallback for non-permitted users:
 * ```tsx
 * <ProjectPermissionGuard 
 *   permission="project.settings.edit" 
 *   projectId={projectId}
 *   fallback={<p className="text-muted-foreground">You don't have permission to edit settings</p>}
 * >
 *   <SettingsForm />
 * </ProjectPermissionGuard>
 * ```
 */
export const ProjectPermissionGuard = ({
    permission,
    projectId,
    workspaceId: propWorkspaceId,
    children,
    fallback = null,
    hideWhileLoading = true,
    loadingFallback = null,
}: ProjectPermissionGuardProps) => {
    const hookWorkspaceId = useWorkspaceId();
    const workspaceId = propWorkspaceId || hookWorkspaceId;
    
    const { can, isLoading, isProjectAdmin } = useProjectPermissions({
        projectId,
        workspaceId,
    });
    
    // Check if user is workspace admin (organization creator/admin)
    // Only call useCurrentMember with a valid workspaceId
    const { data: currentMember, isLoading: isLoadingMember } = useCurrentMember({ 
        workspaceId: workspaceId || "" 
    });
    const memberRole = (currentMember as MemberWithRole)?.role;
    const isWorkspaceAdmin = workspaceId 
        ? (memberRole === "ADMIN" || memberRole === "OWNER")
        : false;

    // Show nothing (or loading fallback) while checking permissions
    if (isLoading || (workspaceId && isLoadingMember)) {
        return hideWhileLoading ? <>{loadingFallback}</> : <>{children}</>;
    }

    // Workspace admins (organization creators/admins) have all permissions
    if (isWorkspaceAdmin) {
        return <>{children}</>;
    }

    // Project admins have all permissions
    if (isProjectAdmin) {
        return <>{children}</>;
    }

    // Check the specific permission
    if (!can(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

interface ProjectPermissionMultiGuardProps {
    /** Array of permissions - user must have ALL of these */
    permissions: string[];
    /** The project ID to check permissions for */
    projectId: string | null | undefined;
    /** The workspace ID (optional) */
    workspaceId?: string | null;
    /** Content to render if user has all permissions */
    children: ReactNode;
    /** Fallback content to render if user lacks any permission */
    fallback?: ReactNode;
    /** Loading indicator */
    loadingFallback?: ReactNode;
}

/**
 * ProjectPermissionMultiGuard
 * 
 * Requires user to have ALL specified permissions.
 * 
 * @example
 * ```tsx
 * <ProjectPermissionMultiGuard 
 *   permissions={["project.members.manage", "project.teams.manage"]} 
 *   projectId={projectId}
 * >
 *   <TeamManagementPanel />
 * </ProjectPermissionMultiGuard>
 * ```
 */
export const ProjectPermissionMultiGuard = ({
    permissions: requiredPermissions,
    projectId,
    workspaceId: propWorkspaceId,
    children,
    fallback = null,
    loadingFallback = null,
}: ProjectPermissionMultiGuardProps) => {
    const hookWorkspaceId = useWorkspaceId();
    const workspaceId = propWorkspaceId || hookWorkspaceId;
    
    const { canAll, isLoading, isProjectAdmin } = useProjectPermissions({
        projectId,
        workspaceId,
    });
    
    // Check if user is workspace admin (organization creator/admin)
    const { data: currentMember, isLoading: isLoadingMember } = useCurrentMember({ 
        workspaceId: workspaceId || "" 
    });
    const memberRole = (currentMember as MemberWithRole)?.role;
    const isWorkspaceAdmin = workspaceId 
        ? (memberRole === "ADMIN" || memberRole === "OWNER")
        : false;

    if (isLoading || (workspaceId && isLoadingMember)) {
        return <>{loadingFallback}</>;
    }

    // Workspace admins (organization creators/admins) have all permissions
    if (isWorkspaceAdmin) {
        return <>{children}</>;
    }

    // Project admins have all permissions
    if (isProjectAdmin) {
        return <>{children}</>;
    }

    // Check all required permissions
    if (!canAll(...requiredPermissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

interface ProjectPermissionAnyGuardProps {
    /** Array of permissions - user must have ANY of these */
    permissions: string[];
    /** The project ID to check permissions for */
    projectId: string | null | undefined;
    /** The workspace ID (optional) */
    workspaceId?: string | null;
    /** Content to render if user has any permission */
    children: ReactNode;
    /** Fallback content to render if user lacks all permissions */
    fallback?: ReactNode;
    /** Loading indicator */
    loadingFallback?: ReactNode;
}

/**
 * ProjectPermissionAnyGuard
 * 
 * Requires user to have ANY of the specified permissions.
 * 
 * @example
 * ```tsx
 * <ProjectPermissionAnyGuard 
 *   permissions={["project.tasks.edit", "project.tasks.create"]} 
 *   projectId={projectId}
 * >
 *   <EditTaskButton />
 * </ProjectPermissionAnyGuard>
 * ```
 */
export const ProjectPermissionAnyGuard = ({
    permissions: requiredPermissions,
    projectId,
    workspaceId: propWorkspaceId,
    children,
    fallback = null,
    loadingFallback = null,
}: ProjectPermissionAnyGuardProps) => {
    const hookWorkspaceId = useWorkspaceId();
    const workspaceId = propWorkspaceId || hookWorkspaceId;
    
    const { canAny, isLoading, isProjectAdmin } = useProjectPermissions({
        projectId,
        workspaceId,
    });
    
    // Check if user is workspace admin (organization creator/admin)
    const { data: currentMember, isLoading: isLoadingMember } = useCurrentMember({ 
        workspaceId: workspaceId || "" 
    });
    const memberRole = (currentMember as MemberWithRole)?.role;
    const isWorkspaceAdmin = workspaceId 
        ? (memberRole === "ADMIN" || memberRole === "OWNER")
        : false;

    if (isLoading || (workspaceId && isLoadingMember)) {
        return <>{loadingFallback}</>;
    }

    // Workspace admins (organization creators/admins) have all permissions
    if (isWorkspaceAdmin) {
        return <>{children}</>;
    }

    // Project admins have all permissions
    if (isProjectAdmin) {
        return <>{children}</>;
    }

    // Check if user has any of the required permissions
    if (!canAny(...requiredPermissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
