"use client";

import { Users, Settings, Activity, LayoutDashboard, Shield, Plus, UserPlus, MoreVertical, Crown, Trash2 } from "lucide-react";
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
import { useTeamId } from "@/features/teams/hooks/use-team-id";
import { DottedSeparator } from "@/components/dotted-separator";

export const TeamIdClient = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [teamId] = useTeamId();

  // Temporary mock data - will be replaced with real API calls
  const team = {
    name: "Engineering Team",
    description: "Core engineering team working on platform development",
    visibility: "WORKSPACE",
    imageUrl: null,
  };

  const members = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "TEAM_LEAD",
      avatar: null,
      joinedAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "MEMBER",
      avatar: null,
      joinedAt: "2024-01-20",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "MEMBER",
      avatar: null,
      joinedAt: "2024-02-01",
    },
  ];

  const stats = {
    totalMembers: 3,
    activeTasks: 12,
    completedTasks: 45,
  };

  const handleAddMember = () => {
    // TODO: Open add member modal
    console.log("Add member");
  };

  const handleRemoveMember = (memberId: string) => {
    // TODO: Implement remove member
    console.log("Remove member:", memberId);
  };

  const handleChangeRole = (memberId: string, newRole: string) => {
    // TODO: Implement change role
    console.log("Change role:", memberId, newRole);
  };

  return (
    <div className="flex flex-col gap-y-4">
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
            <p className="text-muted-foreground mt-1">{team.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="font-normal">
                {team.visibility}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {stats.totalMembers} Members
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="size-4 mr-2" />
            Settings
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
            <div className="text-3xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="size-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="size-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>
                Summary of team activities and current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="size-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="font-medium">Task completed</p>
                      <p className="text-muted-foreground text-xs">
                        John Doe completed "Implement authentication" • 2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="size-2 rounded-full bg-green-500 mt-2" />
                    <div>
                      <p className="font-medium">New member joined</p>
                      <p className="text-muted-foreground text-xs">
                        Mike Johnson joined the team • 5 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="size-2 rounded-full bg-purple-500 mt-2" />
                    <div>
                      <p className="font-medium">Task assigned</p>
                      <p className="text-muted-foreground text-xs">
                        Jane Smith was assigned "Update documentation" • 1 day ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="space-y-4">
                {members.map((member, index) => (
                  <div key={member.id}>
                    {index > 0 && <DottedSeparator className="my-4" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          {member.avatar ? (
                            <AvatarImage src={member.avatar} alt={member.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.name}</p>
                            {member.role === "TEAM_LEAD" && (
                              <Badge variant="default" className="gap-1 text-xs">
                                <Crown className="size-3" />
                                Team Lead
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
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
                            onClick={() => handleChangeRole(member.id, "TEAM_LEAD")}
                          >
                            <Shield className="size-4 mr-2" />
                            Make Team Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(member.id, "MEMBER")}
                          >
                            <Users className="size-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent activities and changes in the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity log coming soon...
              </p>
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
              <p className="text-sm text-muted-foreground">
                Settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
