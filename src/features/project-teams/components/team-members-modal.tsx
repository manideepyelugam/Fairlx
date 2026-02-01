"use client";

import { useState } from "react";
import { Loader2, UserPlus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { useGetProjectTeam } from "../api/use-get-project-team";
import { useRemoveProjectTeamMember } from "../api/use-remove-project-team-member";
import { AddProjectTeamMemberModal } from "./add-project-team-member-modal";
import { PopulatedProjectTeam } from "../types";

interface TeamMembersModalProps {
    team: PopulatedProjectTeam;
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canManage?: boolean;
}

export function TeamMembersModal({
    team,
    projectId,
    open,
    onOpenChange,
    canManage = false,
}: TeamMembersModalProps) {
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);

    // Fetch fresh team data with members
    const { data: teamData, isLoading, refetch } = useGetProjectTeam({ 
        teamId: team.$id,
        enabled: open,
    });

    const { mutate: removeMember, isPending: isRemovingMember } = useRemoveProjectTeamMember({ projectId });

    const displayTeam = teamData || team;
    const members = displayTeam.members || [];

    const handleRemoveMember = () => {
        if (!memberToRemove) return;
        
        removeMember(
            { teamId: team.$id, userId: memberToRemove.userId },
            {
                onSuccess: () => {
                    setMemberToRemove(null);
                    refetch();
                },
            }
        );
    };

    const handleAddMemberSuccess = () => {
        setIsAddMemberOpen(false);
        refetch();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: displayTeam.color || "#4F46E5" }}
                            >
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg">{displayTeam.name}</DialogTitle>
                                <DialogDescription>
                                    {members.length} member{members.length !== 1 ? "s" : ""} in this team
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {displayTeam.description && (
                        <p className="text-sm text-muted-foreground">
                            {displayTeam.description}
                        </p>
                    )}

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Team Members</h4>
                            {canManage && (
                                <Button 
                                    size="sm" 
                                    onClick={() => setIsAddMemberOpen(true)}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Member
                                </Button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No members in this team yet</p>
                                {canManage && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-3"
                                        onClick={() => setIsAddMemberOpen(true)}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add First Member
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <ScrollArea className="max-h-[300px]">
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div
                                            key={member.$id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={member.user?.profileImageUrl} />
                                                    <AvatarFallback className="text-sm">
                                                        {member.user?.name?.charAt(0).toUpperCase() || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {member.user?.name || "Unknown"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.user?.email || ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {member.teamRole && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {member.teamRole}
                                                    </Badge>
                                                )}
                                                {canManage && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setMemberToRemove({
                                                            userId: member.userId,
                                                            name: member.user?.name || "this member",
                                                        })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Member Modal */}
            {isAddMemberOpen && (
                <AddProjectTeamMemberModal
                    projectId={projectId}
                    teamId={team.$id}
                    open={isAddMemberOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            handleAddMemberSuccess();
                        }
                        setIsAddMemberOpen(open);
                    }}
                />
            )}

            {/* Remove Confirmation */}
            <AlertDialog 
                open={!!memberToRemove} 
                onOpenChange={(open) => !open && setMemberToRemove(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {memberToRemove?.name} from &quot;{displayTeam.name}&quot;?
                            They will no longer have access to this team&apos;s permissions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRemovingMember}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            disabled={isRemovingMember}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isRemovingMember ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
