"use client";

import { useState } from "react";
import { Loader2, UserPlus, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetProjectMembers } from "@/features/project-members/api/use-get-project-members";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjectTeams } from "@/features/project-teams/api/use-get-project-teams";
import { useGetProjectRoles } from "@/features/project-members/api/use-get-project-roles";
import { useAddProjectMember } from "@/features/project-members/api/use-add-project-member";
import { useRemoveProjectMember } from "@/features/project-members/api/use-remove-project-member";
import { useConfirm } from "@/hooks/use-confirm";

import { ProjectPermissionsEditor } from "@/components/project-permissions-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTeamsList } from "@/features/project-teams/components";

export const ProjectMembersClient = () => {
    const projectId = useProjectId();
    const workspaceId = useWorkspaceId();

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");

    // ... (Confirm dialog logic)
    const [ConfirmRemoveDialog, confirmRemove] = useConfirm(
        "Remove Member",
        "Are you sure you want to remove this member from the project team?",
        "destructive"
    );

    // Queries
    const { data: projectMembersData, isLoading: isLoadingProjectMembers } = useGetProjectMembers({ projectId, workspaceId });
    const { data: workspaceMembersData, isLoading: isLoadingWorkspaceMembers } = useGetMembers({ workspaceId });
    const { data: teamsData, isLoading: isLoadingTeams } = useGetProjectTeams({ projectId });
    const { data: rolesData, isLoading: isLoadingRoles } = useGetProjectRoles({ projectId, workspaceId });

    // Mutations
    const { mutateAsync: addMember, isPending: isAddingMember } = useAddProjectMember();
    const { mutate: removeMember, isPending: isRemovingMember } = useRemoveProjectMember();

    const projectMembers = projectMembersData?.documents ?? [];
    const workspaceMembers = workspaceMembersData?.documents ?? [];
    const teams = teamsData?.documents ?? [];
    const roles = rolesData?.documents ?? [];

    const isLoading = isLoadingProjectMembers || isLoadingWorkspaceMembers || isLoadingTeams || isLoadingRoles;

    const handleAddMember = async () => {
        // Team is now optional - users can be added without a team
        if (selectedUserIds.length === 0 || !selectedRoleId) return;

        try {
            const promises = selectedUserIds.map(userId =>
                addMember({
                    workspaceId,
                    projectId,
                    userId,
                    teamId: selectedTeamId || undefined, // Optional
                    roleId: selectedRoleId,
                })
            );
            await Promise.all(promises);
            setIsAddMemberOpen(false);
            setSelectedUserIds([]);
            setSelectedTeamId("");
            setSelectedRoleId("");
        } catch (error) {
            console.error("Failed to add members", error);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        const ok = await confirmRemove();
        if (!ok) return;
        removeMember({ memberId, projectId });
    };

    const memberOptions = workspaceMembers.map((member) => ({
        label: member.name || "Unknown",
        value: member.userId,
        icon: () => (
            <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={member.profileImageUrl || undefined} />
                <AvatarFallback className="text-[8px]">
                    {member.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
        ),
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <ConfirmRemoveDialog />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Project Members
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage who has access to this project.
                    </p>
                </div>
                {/* Only show Add Member button on Members tab, handled inside TabsContent if needed, or global header */}
            </div>

            <Tabs defaultValue="members" className="w-full">
                <TabsList>
                    <TabsTrigger value="members" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Members</TabsTrigger>
                    <TabsTrigger value="teams" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Teams</TabsTrigger>
                    <TabsTrigger value="permissions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Permissions & Roles</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6 space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={() => setIsAddMemberOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add from Workspace
                        </Button>
                    </div>

                    {projectMembers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No Members Yet</h3>
                                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                                    Project members can view and contribute to this project.
                                    Add members from your workspace to get started.
                                </p>
                                <Button onClick={() => setIsAddMemberOpen(true)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add from Workspace
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {projectMembers.map((member) => (
                                <Card key={member.$id} className="group hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={member.user?.profileImageUrl} />
                                                    <AvatarFallback>
                                                        {member.user?.name?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.user?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleRemoveMember(member.$id)}
                                                        disabled={isRemovingMember}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <span>Team:</span>
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {member.team?.name || "Unknown"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <span>Role:</span>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                    style={{
                                                        backgroundColor: member.role?.color ? `${member.role.color}20` : undefined,
                                                        color: member.role?.color,
                                                        borderColor: member.role?.color ? `${member.role.color}40` : undefined,
                                                    }}
                                                >
                                                    {member.role?.name || "Member"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="teams" className="mt-6">
                    <ProjectTeamsList projectId={projectId} canManage={true} />
                </TabsContent>

                <TabsContent value="permissions" className="mt-6">
                    <ProjectPermissionsEditor />
                </TabsContent>
            </Tabs>

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add from Workspace</DialogTitle>
                        <DialogDescription>
                            Select workspace members to add to this project. Team assignment is optional.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* User Selection */}
                        <div className="space-y-2">
                            <Label>Members</Label>
                            <MultiSelect
                                options={memberOptions}
                                selected={selectedUserIds}
                                onChange={setSelectedUserIds}
                                placeholder="Select members..."
                            />
                        </div>

                        {/* Team Selection (Optional) */}
                        <div className="space-y-2">
                            <Label>Team <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="No team (can assign later)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">No team (assign later)</SelectItem>
                                    {teams.map((team) => (
                                        <SelectItem key={team.$id} value={team.$id}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {teams.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    You can create teams later in the Teams tab.
                                </p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.$id} value={role.$id}>
                                            <div className="flex items-center gap-2">
                                                {role.color && (
                                                    <div
                                                        className="size-2 rounded-full"
                                                        style={{ backgroundColor: role.color }}
                                                    />
                                                )}
                                                {role.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddMember}
                            disabled={selectedUserIds.length === 0 || !selectedRoleId || isAddingMember}
                        >
                            {isAddingMember ? "Adding..." : "Add Members"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
