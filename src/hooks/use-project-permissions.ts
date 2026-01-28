"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { client } from "@/lib/rpc";
import { ProjectPermissionResult } from "@/features/project-members/types";
import { PROJECT_PERMISSIONS } from "@/lib/project-permissions";

interface UseProjectPermissionsProps {
    projectId: string | null | undefined;
    workspaceId?: string | null;
}

/**
 * Hook to get user's permissions for a specific project.
 * 
 * Usage:
 * ```tsx
 * const { can, isLoading, isProjectAdmin } = useProjectPermissions({ projectId });
 * 
 * if (can("task.create")) {
 *   // Show create button
 * }
 * ```
 * 
 * Permissions are resolved from project_members → project_roles.
 * If user is in multiple teams, permissions are merged (union).
 */
export const useProjectPermissions = ({ projectId, workspaceId }: UseProjectPermissionsProps) => {
    const { data, isLoading, error } = useQuery<ProjectPermissionResult | null>({
        queryKey: ["project-permissions", projectId, workspaceId],
        queryFn: async () => {
            if (!projectId) return null;

            const response = await client.api["project-members"]["permissions"].$get({
                query: {
                    projectId,
                    ...(workspaceId && { workspaceId }),
                },
            });

            if (!response.ok) {
                return null;
            }

            const json = await response.json();
            return json.data as ProjectPermissionResult;
        },
        enabled: !!projectId,
        staleTime: 30000, // Cache for 30 seconds
        refetchOnWindowFocus: true, // Refetch when user returns to tab
    });

    const permissions = useMemo(() => data?.permissions || [], [data]);

    /**
     * Check if user has a specific permission in this project.
     * @param permission - Permission string (e.g., "task.create")
     */
    const can = useCallback(
        (permission: string): boolean => {
            if (isLoading || !data) return false;
            return permissions.includes(permission);
        },
        [permissions, isLoading, data]
    );

    /**
     * Check if user has ALL of the specified permissions.
     */
    const canAll = useCallback(
        (...perms: string[]): boolean => {
            if (isLoading || !data) return false;
            return perms.every((p) => permissions.includes(p));
        },
        [permissions, isLoading, data]
    );

    /**
     * Check if user has ANY of the specified permissions.
     */
    const canAny = useCallback(
        (...perms: string[]): boolean => {
            if (isLoading || !data) return false;
            return perms.some((p) => permissions.includes(p));
        },
        [permissions, isLoading, data]
    );

    return {
        // Core permission check
        can,
        canAll,
        canAny,

        // Convenience permission checks
        canViewProject: can(PROJECT_PERMISSIONS.PROJECT_VIEW),
        canManageProjectSettings: can(PROJECT_PERMISSIONS.PROJECT_SETTINGS_MANAGE),
        canCreateTeams: can(PROJECT_PERMISSIONS.TEAM_CREATE),
        canManageTeams: can(PROJECT_PERMISSIONS.TEAM_MANAGE),
        canInviteMembers: can(PROJECT_PERMISSIONS.MEMBER_INVITE),
        canRemoveMembers: can(PROJECT_PERMISSIONS.MEMBER_REMOVE),
        canCreateTasks: can(PROJECT_PERMISSIONS.TASK_CREATE),
        canUpdateTasks: can(PROJECT_PERMISSIONS.TASK_UPDATE),
        canDeleteTasks: can(PROJECT_PERMISSIONS.TASK_DELETE),
        canAssignTasks: can(PROJECT_PERMISSIONS.TASK_ASSIGN),
        canViewSprints: can(PROJECT_PERMISSIONS.SPRINT_VIEW),
        canCreateSprints: can(PROJECT_PERMISSIONS.SPRINT_CREATE),
        canStartSprints: can(PROJECT_PERMISSIONS.SPRINT_START),
        canCompleteSprints: can(PROJECT_PERMISSIONS.SPRINT_COMPLETE),
        canManageBoard: can(PROJECT_PERMISSIONS.BOARD_MANAGE),
        canCreateComments: can(PROJECT_PERMISSIONS.COMMENT_CREATE),
        canDeleteComments: can(PROJECT_PERMISSIONS.COMMENT_DELETE),
        canManageRoles: canAll(
            PROJECT_PERMISSIONS.ROLE_CREATE,
            PROJECT_PERMISSIONS.ROLE_UPDATE,
            PROJECT_PERMISSIONS.ROLE_DELETE
        ),

        // Metadata
        isLoading,
        error,
        permissions,
        roles: data?.roles || [],
        isProjectAdmin: data?.isProjectAdmin || false,
    };
};
