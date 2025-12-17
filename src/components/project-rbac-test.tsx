"use client";

import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { useProjectMember } from "@/hooks/use-project-member";
import { useGetProjectRoles } from "@/features/project-members";
import { PROJECT_PERMISSIONS } from "@/lib/project-permissions";

/**
 * Test Component for Project-Scoped RBAC
 * 
 * This component demonstrates and tests the project permission hooks.
 * Mount this in a project context to verify permissions work correctly.
 */

interface ProjectRBACTestProps {
    projectId: string;
    workspaceId?: string;
}

export function ProjectRBACTest({ projectId, workspaceId }: ProjectRBACTestProps) {
    const {
        can,
        permissions,
        isProjectAdmin,
        isLoading: permissionsLoading,
        canCreateTasks,
        canDeleteTasks,
        canManageRoles,
    } = useProjectPermissions({ projectId, workspaceId });

    const {
        isMember,
        teams,
        roles: memberRoles,
        isLoading: memberLoading,
    } = useProjectMember({ projectId });

    const { data: projectRoles, isLoading: rolesLoading } = useGetProjectRoles({
        projectId,
        workspaceId,
    });

    const isLoading = permissionsLoading || memberLoading || rolesLoading;

    if (isLoading) {
        return (
            <div className="p-6 border rounded-lg">
                <p className="text-sm text-muted-foreground">Loading permissions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 border rounded-lg bg-background">
            <div>
                <h3 className="text-lg font-semibold mb-2">🔐 Project RBAC Status</h3>
                <p className="text-sm text-muted-foreground">
                    Testing project-scoped permissions for project: {projectId}
                </p>
            </div>

            {/* Membership Status */}
            <div className="space-y-2">
                <h4 className="font-medium">Membership</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className={isMember ? "text-green-600" : "text-red-600"}>
                            {isMember ? "✓" : "✗"}
                        </span>
                        <span>Is Member</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={isProjectAdmin ? "text-green-600" : "text-gray-400"}>
                            {isProjectAdmin ? "✓" : "✗"}
                        </span>
                        <span>Is Project Admin</span>
                    </div>
                </div>
            </div>

            {/* Teams */}
            {teams.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium">Teams ({teams.length})</h4>
                    <div className="space-y-1">
                        {teams.map((team) => (
                            <div key={team.$id} className="text-sm px-2 py-1 bg-muted rounded">
                                {team.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Roles */}
            {memberRoles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium">My Roles ({memberRoles.length})</h4>
                    <div className="space-y-1">
                        {memberRoles.map((role) => (
                            <div
                                key={role.$id}
                                className="text-sm px-2 py-1 rounded flex items-center justify-between"
                                style={{ backgroundColor: role.color ? `${role.color}20` : undefined }}
                            >
                                <span>{role.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {role.permissions?.length || 0} permissions
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Permission Checks */}
            <div className="space-y-2">
                <h4 className="font-medium">Permission Tests</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <PermissionCheck label="Create Tasks" allowed={canCreateTasks} />
                    <PermissionCheck label="Delete Tasks" allowed={canDeleteTasks} />
                    <PermissionCheck
                        label="Create Sprints"
                        allowed={can(PROJECT_PERMISSIONS.SPRINT_CREATE)}
                    />
                    <PermissionCheck
                        label="Manage Board"
                        allowed={can(PROJECT_PERMISSIONS.BOARD_MANAGE)}
                    />
                    <PermissionCheck label="Manage Roles" allowed={canManageRoles} />
                    <PermissionCheck
                        label="Invite Members"
                        allowed={can(PROJECT_PERMISSIONS.MEMBER_INVITE)}
                    />
                </div>
            </div>

            {/* Total Permissions */}
            <div className="space-y-2">
                <h4 className="font-medium">
                    Total Permissions ({permissions.length})
                </h4>
                <div className="max-h-40 overflow-y-auto text-xs space-y-1 font-mono">
                    {permissions.map((perm) => (
                        <div key={perm} className="px-2 py-1 bg-muted rounded">
                            {perm}
                        </div>
                    ))}
                </div>
            </div>

            {/* All Project Roles */}
            {projectRoles && projectRoles.documents.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium">
                        All Project Roles ({projectRoles.total})
                    </h4>
                    <div className="space-y-2 text-sm">
                        {projectRoles.documents.map((role) => (
                            <div key={role.$id} className="p-2 border rounded">
                                <div className="font-medium">{role.name}</div>
                                {role.description && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {role.description}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                    {role.permissions.length} permissions
                                    {role.isDefault && " • Default Role"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PermissionCheck({
    label,
    allowed,
}: {
    label: string;
    allowed: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className={allowed ? "text-green-600" : "text-gray-400"}>
                {allowed ? "✓" : "✗"}
            </span>
            <span>{label}</span>
        </div>
    );
}
