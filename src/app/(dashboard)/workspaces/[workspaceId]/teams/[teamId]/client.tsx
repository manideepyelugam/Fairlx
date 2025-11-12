"use client";

import { Users, Settings, Shield, UserPlus, MoreVertical, Crown, Trash2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { DottedSeparator } from "@/components/dotted-separator";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";
import { useConfirm } from "@/hooks/use-confirm";
import { TeamMemberRole, TeamVisibility } from "@/features/teams/types";

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
    // TODO: Open add member modal
    console.log("Add member");
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
    <div className="flex flex-col gap-y-4">
      <ConfirmDialog />
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 rounded-xl border-2">
            {team.imageUrl ? (
              <AvatarImage src={team.imageUrl} alt={team.name} />
            ) : (
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white text-2xl font-bold">
                {team.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-muted-foreground mt-1">{team.description || "No description provided"}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="font-normal">
                {getVisibilityLabel(team.visibility)}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {team.statistics?.memberCount || 0} Members
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/workspaces/${workspaceId}/teams`)}>
            Back to Teams
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{team.statistics?.memberCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {team.teamLead ? team.teamLead.name : "Not assigned"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {getVisibilityLabel(team.visibility)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="size-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage team members and their roles
                  </CardDescription>
                </div>
                <Button onClick={handleAddMember} size="sm" className="gap-2">
                  <UserPlus className="size-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                    Add members to this team to start collaborating
                  </p>
                  <Button onClick={handleAddMember} className="gap-2">
                    <UserPlus className="size-4" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member, index) => (
                    <div key={member.$id}>
                      {index > 0 && <DottedSeparator className="my-4" />}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            {member.user?.profileImageUrl ? (
                              <AvatarImage src={member.user.profileImageUrl} alt={member.user.name} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                                {member.user?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.user?.name || "Unknown"}</p>
                              {member.role === TeamMemberRole.LEAD && (
                                <Badge variant="default" className="gap-1 text-xs">
                                  <Crown className="size-3" />
                                  Team Lead
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {member.user?.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleChangeRole(member.memberId, TeamMemberRole.LEAD)}
                              disabled={member.role === TeamMemberRole.LEAD}
                            >
                              <Shield className="size-4 mr-2" />
                              Make Team Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleChangeRole(member.memberId, TeamMemberRole.MEMBER)}
                              disabled={member.role === TeamMemberRole.MEMBER}
                            >
                              <Users className="size-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.memberId)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-4 mr-2" />
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
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Configure team preferences and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                <AlertCircle className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Settings coming soon</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Team settings and configuration options will be available in a future update.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
