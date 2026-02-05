"use client";

import { useState } from "react";
import { Plus, Users, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useGetProjectTeams } from "../api/use-get-project-teams";
import { useDeleteProjectTeam } from "../api/use-delete-project-team";
import { ProjectTeamCard } from "./project-team-card";
import { CreateProjectTeamModal } from "./create-project-team-modal";
import { AddProjectTeamMemberModal } from "./add-project-team-member-modal";
import { TeamMembersModal } from "./team-members-modal";
import { PopulatedProjectTeam } from "../types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectTeamsListProps {
    projectId: string;
    canManage?: boolean;
}

export function ProjectTeamsList({ projectId, canManage = false }: ProjectTeamsListProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null);
    const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
    const [deleteTeamName, setDeleteTeamName] = useState("");
    const [viewMembersTeam, setViewMembersTeam] = useState<PopulatedProjectTeam | null>(null);

    const { data: teamsData, isLoading } = useGetProjectTeams({ projectId });
    const { mutate: deleteTeam, isPending: isDeleting } = useDeleteProjectTeam({ projectId });

    const teams = teamsData?.documents || [];

    const handleDeleteConfirm = () => {
        if (deleteTeamId) {
            deleteTeam({ teamId: deleteTeamId }, {
                onSuccess: () => setDeleteTeamId(null),
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Project Teams
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage teams within this project. Click on a team to view its members.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Team
                    </Button>
                )}
            </div>

            {/* Teams Grid */}
            {teams.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                            Teams help organize project members into groups with shared permissions.
                            Create your first team to get started.
                        </p>
                        {canManage && (
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Team
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <ProjectTeamCard
                            key={team.$id}
                            team={team}
                            canManage={canManage}
                            onViewMembers={() => setViewMembersTeam(team)}
                            onAddMember={() => setAddMemberTeamId(team.$id)}
                            onDelete={() => {
                                setDeleteTeamId(team.$id);
                                setDeleteTeamName(team.name);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <CreateProjectTeamModal
                projectId={projectId}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            {/* View Members Modal */}
            {viewMembersTeam && (
                <TeamMembersModal
                    team={viewMembersTeam}
                    projectId={projectId}
                    open={!!viewMembersTeam}
                    onOpenChange={(open) => !open && setViewMembersTeam(null)}
                    canManage={canManage}
                />
            )}

            {/* Add Member Modal */}
            {addMemberTeamId && (
                <AddProjectTeamMemberModal
                    projectId={projectId}
                    teamId={addMemberTeamId}
                    open={!!addMemberTeamId}
                    onOpenChange={(open: boolean) => !open && setAddMemberTeamId(null)}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTeamId} onOpenChange={(open) => !open && setDeleteTeamId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Team</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deleteTeamName}&quot;?
                            This will remove all team members and permissions. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
