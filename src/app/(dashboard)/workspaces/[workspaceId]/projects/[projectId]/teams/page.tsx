"use client";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { ProjectTeamsList } from "@/features/project-teams/components";

export default function ProjectTeamsPage() {
    const projectId = useProjectId();

    // TODO: Use resolveUserProjectAccess to determine if user can manage teams
    // For now, allow management for all users who can access this page
    const canManage = true;

    if (!projectId) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No project selected</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <ProjectTeamsList projectId={projectId} canManage={canManage} />
        </div>
    );
}
