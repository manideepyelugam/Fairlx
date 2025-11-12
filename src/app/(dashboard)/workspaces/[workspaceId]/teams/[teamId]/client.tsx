"use client";

import { useState } from "react";
import { Users, Settings, Shield, UserPlus, MoreVertical, Crown, Trash2, ArrowLeft, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTeam } from "@/features/teams/api/use-get-team";
import { useGetTeamMembers } from "@/features/teams/api/use-get-team-members";
import { useRemoveTeamMember } from "@/features/teams/api/use-remove-team-member";
import { useUpdateTeamMember } from "@/features/teams/api/use-update-team-member";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";
import { useConfirm } from "@/hooks/use-confirm";
import { TeamMemberRole, TeamVisibility } from "@/features/teams/types";
import { AddMemberModal } from "@/features/teams/components/add-member-modal";

const getVisibilityLabel = (visibility: TeamVisibility) => {
  switch (visibility) {
    case TeamVisibility.ALL:
      return "All Members";
    case TeamVisibility.PROGRAM_ONLY:
      return "Program Only";
    case TeamVisibility.TEAM_ONLY:
      return "Team Only";
    default:
      return visibility;
  }
};

interface TeamIdClientProps {
  teamId: string;
}

export const TeamIdClient = ({ teamId }: TeamIdClientProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const { data: team, isLoading: isLoadingTeam } = useGetTeam({ teamId });
  const { data: teamMembersData, isLoading: isLoadingMembers } = useGetTeamMembers({ teamId });
  const { mutate: removeTeamMember } = useRemoveTeamMember();
  const { mutate: updateTeamMember } = useUpdateTeamMember();

  const [ConfirmDialog, confirm] = useConfirm(
    "Remove Member",
    "Are you sure you want to remove this member from the team?",
    "destructive"
  );

  const isLoading = isLoadingTeam || isLoadingMembers;
  const members = teamMembersData?.documents || [];

  const handleAddMember = () => {
    setIsAddMemberOpen(true);
  };

  const handleRemoveMember = async (memberId: string) => {
    const ok = await confirm();
    if (!ok) return;

    removeTeamMember({
      param: { teamId, memberId },
    });
  };

  const handleChangeRole = (memberId: string, newRole: TeamMemberRole) => {
    updateTeamMember({
      param: { teamId, memberId },
      json: { role: newRole },
    });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!team) {
    return <PageError message="Team not found" />;
  }

  return (
    <div className="h-full flex flex-col">
      <ConfirmDialog />
      <AddMemberModal 
        open={isAddMemberOpen} 
        onOpenChange={setIsAddMemberOpen} 
        teamId={teamId}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/workspaces/${workspaceId}/teams`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <Avatar className="size-10 rounded-lg">
              {team.imageUrl ? (
                <AvatarImage src={team.imageUrl} alt={team.name} />
              ) : (
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white text-base font-semibold">
                  {team.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-xl font-bold leading-none">{team.name}</h1>
              {team.description && (
                <p className="text-xs text-muted-foreground mt-1">{team.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {team.statistics?.memberCount || 0} {team.statistics?.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-1.5"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Compact Info Bar */}
      <div className="flex items-center gap-3 px-3 py-2 bg-muted/40 rounded-md border mb-4">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Visibility:</span>
          <span className="text-xs font-medium">{getVisibilityLabel(team.visibility)}</span>
        </div>
        {team.teamLead && (
          <>
            <Separator orientation="vertical" className="h-3.5" />
            <div className="flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">Lead:</span>
              <span className="text-xs font-medium">{team.teamLead.name}</span>
            </div>
          </>
        )}
      </div>

      {/* Members Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Team Members</h2>
          </div>
          <Button onClick={handleAddMember} size="sm" className="gap-1.5 h-8 text-xs">
            <UserPlus className="size-3.5" />
            Add Member
          </Button>
        </div>

        <Card className="flex-1">
          <CardContent className="p-4">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Users className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">No members yet</h3>
                  <p className="text-xs text-muted-foreground mb-3 max-w-[280px]">
                    Add members to this team to start collaborating
                  </p>
                  <Button onClick={handleAddMember} size="sm" className="gap-1.5 h-8 text-xs">
                    <UserPlus className="size-3.5" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-0">
                  {members.map((member, index) => (
                    <div key={member.$id}>
                      {index > 0 && <Separator className="my-2" />}
                      <div className="flex items-center justify-between py-2 group hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Avatar className="size-8 shrink-0">
                            {member.user?.profileImageUrl ? (
                              <AvatarImage src={member.user.profileImageUrl} alt={member.user.name} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold">
                                {member.user?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate">{member.user?.name || "Unknown"}</p>
                              {member.role === TeamMemberRole.LEAD && (
                                <Badge variant="default" className="gap-1 text-[10px] h-4 px-1.5 shrink-0">
                                  <Crown className="size-2.5" />
                                  Lead
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.user?.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleChangeRole(member.memberId, TeamMemberRole.LEAD)}
                              disabled={member.role === TeamMemberRole.LEAD}
                              className="text-xs"
                            >
                              <Shield className="size-3.5 mr-2" />
                              Make Team Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleChangeRole(member.memberId, TeamMemberRole.MEMBER)}
                              disabled={member.role === TeamMemberRole.MEMBER}
                              className="text-xs"
                            >
                              <Users className="size-3.5 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.memberId)}
                              className="text-destructive focus:text-destructive text-xs"
                            >
                              <Trash2 className="size-3.5 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
