"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { ProjectTeamsList } from "@/features/project-teams/components";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProjectTeamsPage() {
    const projectId = useProjectId();
    const workspaceId = useWorkspaceId();

    // Permission hooks
    const {
        canManageProjectTeams,
        canViewMembers: canViewMembersProject,
        isProjectAdmin,
        isLoading: isLoadingPermissions,
    } = useProjectPermissions({ projectId, workspaceId });
    
    // Check if user is workspace admin (organization creator/admin)
    const { data: currentMember, isLoading: isLoadingMember } = useCurrentMember({ workspaceId });
    const isWorkspaceAdmin = currentMember?.role === "ADMIN" || currentMember?.role === "OWNER";
    
    // Effective permissions
    const canViewTeams = isWorkspaceAdmin || isProjectAdmin || canViewMembersProject;
    const canManage = isWorkspaceAdmin || isProjectAdmin || canManageProjectTeams;
    
    const isLoading = isLoadingPermissions || isLoadingMember;

    if (!projectId) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No project selected</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!canViewTeams) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        You don&apos;t have permission to view project teams.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6">
            <ProjectTeamsList projectId={projectId} canManage={canManage} />
        </div>
    );
}
