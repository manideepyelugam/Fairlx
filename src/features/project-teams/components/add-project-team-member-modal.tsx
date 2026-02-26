"use client";

import { useState } from "react";
import { Loader2, UserPlus, Search, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { useAddProjectTeamMember } from "../api/use-add-project-team-member";
import { useGetProjectMembers } from "@/features/project-members/api/use-get-project-members";
import { useGetProjectTeam } from "../api/use-get-project-team";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";

interface AddProjectTeamMemberModalProps {
    projectId: string;
    teamId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddProjectTeamMemberModal({
    projectId,
    teamId,
    open,
    onOpenChange,
}: AddProjectTeamMemberModalProps) {
    const workspaceId = useWorkspaceId();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [teamRole, setTeamRole] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const { mutate: addMember } = useAddProjectTeamMember({ projectId });

    // Fetch actual project members
    const { data: membersData, isLoading: isLoadingMembers } = useGetProjectMembers({
        projectId,
        workspaceId
    });
    
    // Fetch current team members to filter them out
    const { data: teamData } = useGetProjectTeam({ teamId, enabled: open });
    
    // Fetch workspace members to identify admins
    const { data: workspaceMembersData } = useGetMembers({ workspaceId });
    
    // Create a set of admin userIds (ADMIN/OWNER roles cannot be added to teams)
    const adminUserIds = new Set(
        (workspaceMembersData?.documents || [])
            .filter((m) => m.role === "ADMIN" || m.role === "OWNER")
            .map((m) => m.userId)
    );

    // Create a set of existing team member userIds
    const existingTeamMemberIds = new Set(
        (teamData?.members || []).map((m: { userId: string }) => m.userId)
    );

    // Transform project members to display format, filtering out workspace admins AND existing team members
    const availableMembers = (membersData?.documents || [])
        .filter((member) => !adminUserIds.has(member.userId))
        .filter((member) => !existingTeamMemberIds.has(member.userId))
        .map((member) => ({
            $id: member.$id,
            userId: member.userId,
            name: member.user?.name || "Unknown",
            email: member.user?.email || "",
            profileImageUrl: member.user?.profileImageUrl,
        }));

    const filteredMembers = availableMembers.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMember = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const removeMember = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    };

    const selectedMembers = availableMembers.filter(m => selectedUserIds.has(m.userId));

    const handleAddMembers = async () => {
        if (selectedUserIds.size === 0) return;
        setIsAdding(true);

        const userIdsArray = Array.from(selectedUserIds);
        let completed = 0;

        for (const userId of userIdsArray) {
            await new Promise<void>((resolve, reject) => {
                addMember(
                    {
                        projectId,
                        teamId,
                        userId,
                        teamRole: teamRole || undefined,
                    },
                    {
                        onSuccess: () => {
                            completed++;
                            resolve();
                        },
                        onError: () => {
                            completed++;
                            resolve(); // Continue even if one fails
                        },
                    }
                );
            });
        }

        setIsAdding(false);
        setSelectedUserIds(new Set());
        setTeamRole("");
        setSearchQuery("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Add Team Members
                    </DialogTitle>
                    <DialogDescription>
                        Select one or more project members to add to this team.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Selected Members Chips */}
                    {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedMembers.map((member) => (
                                <Badge
                                    key={member.userId}
                                    variant="secondary"
                                    className="flex items-center gap-1 pr-1 bg-muted text-foreground"
                                >
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={member.profileImageUrl} />
                                        <AvatarFallback className="text-[8px]">
                                            {member.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{member.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeMember(member.userId)}
                                        className="ml-0.5 hover:bg-accent rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search project members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Members List */}
                    <ScrollArea className="h-[220px] rounded-md border p-1">
                        {isLoadingMembers ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                {availableMembers.length === 0
                                    ? "All project members are already in this team"
                                    : "No matching members found"}
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredMembers.map((member) => {
                                    const isSelected = selectedUserIds.has(member.userId);
                                    return (
                                        <button
                                            key={member.userId}
                                            type="button"
                                            onClick={() => toggleMember(member.userId)}
                                            className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                                                isSelected
                                                    ? "bg-muted"
                                                    : "hover:bg-muted/50"
                                            }`}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                className="pointer-events-none"
                                            />
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={member.profileImageUrl} />
                                                <AvatarFallback className="text-xs">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{member.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Team Role */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Team Role (optional)</label>
                        <Input
                            placeholder="e.g., Lead, Reviewer, Designer"
                            value={teamRole}
                            onChange={(e) => setTeamRole(e.target.value)}
                            disabled={isAdding}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Applied to all selected members
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isAdding}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddMembers}
                            disabled={isAdding || selectedUserIds.size === 0}
                        >
                            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add {selectedUserIds.size > 0 ? `${selectedUserIds.size} Member${selectedUserIds.size > 1 ? "s" : ""}` : "to Team"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
