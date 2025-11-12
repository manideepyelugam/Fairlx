"use client";

import { Plus, MoreVertical, Pencil, Trash2, Users2, ArrowRight, Shield, Search, Filter, Grid3x3, List, Users, Layers } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTeams } from "@/features/teams/api/use-get-teams";
import { useDeleteTeam } from "@/features/teams/api/use-delete-team";
import { useCreateTeamModal } from "@/features/teams/hooks/use-create-team-modal";
import { useEditTeamModal } from "@/features/teams/hooks/use-edit-team-modal";
import { useTeamId } from "@/features/teams/hooks/use-team-id";
import { CreateTeamModal } from "@/features/teams/components/create-team-modal";
import { EditTeamModal } from "@/features/teams/components/edit-team-modal";
import { useConfirm } from "@/hooks/use-confirm";
import { TeamVisibility } from "@/features/teams/types";
import { cn } from "@/lib/utils";

const getVisibilityColor = (visibility: TeamVisibility) => {
  switch (visibility) {
    case TeamVisibility.ALL:
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case TeamVisibility.PROGRAM_ONLY:
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case TeamVisibility.TEAM_ONLY:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:
      return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
  }
};

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

const getVisibilityIcon = (visibility: TeamVisibility) => {
  switch (visibility) {
    case TeamVisibility.ALL:
      return Users;
    case TeamVisibility.PROGRAM_ONLY:
      return Layers;
    case TeamVisibility.TEAM_ONLY:
      return Shield;
    default:
      return Shield;
  }
};

export const TeamsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: teams, isLoading } = useGetTeams({ workspaceId });
  const { open: openCreate } = useCreateTeamModal();
  const { open: openEdit } = useEditTeamModal();
  const [, setTeamId] = useTeamId();
  const { mutate: deleteTeam } = useDeleteTeam();

  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Team",
    "This action cannot be undone. All team members will be removed from the team.",
    "destructive"
  );

  // Filter and search teams
  const filteredTeams = useMemo(() => {
    if (!teams?.documents) return [];
    
    return teams.documents.filter((team) => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           team.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVisibility = visibilityFilter === "all" || team.visibility === visibilityFilter;
      
      return matchesSearch && matchesVisibility;
    });
  }, [teams, searchQuery, visibilityFilter]);

  // Team statistics
  const stats = useMemo(() => {
    if (!teams?.documents) return { total: 0, all: 0, program: 0, teamOnly: 0 };
    
    return {
      total: teams.documents.length,
      all: teams.documents.filter(t => t.visibility === TeamVisibility.ALL).length,
      program: teams.documents.filter(t => t.visibility === TeamVisibility.PROGRAM_ONLY).length,
      teamOnly: teams.documents.filter(t => t.visibility === TeamVisibility.TEAM_ONLY).length,
    };
  }, [teams]);

  const handleEdit = (teamId: string) => {
    setTeamId(teamId);
    openEdit();
  };

  const handleDelete = async (teamId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;

    deleteTeam({ param: { teamId } });
  };

  return (
    <div className="w-full h-full flex flex-col p-6">
      <DeleteDialog />
      <CreateTeamModal />
      <EditTeamModal />
      
      {/* Header with Stats */}
      <div className="space-y-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Manage your workspace teams and collaborate effectively
            </p>
          </div>
          <Button onClick={openCreate} size="default" className="gap-2">
            <Plus className="size-4" />
            Create Team
          </Button>
        </div>

        {/* Statistics Cards */}
        {!isLoading && teams && teams.documents.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Users2 className="size-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">All Members</p>
                    <p className="text-2xl font-bold mt-1">{stats.all}</p>
                  </div>
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="size-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Program Only</p>
                    <p className="text-2xl font-bold mt-1">{stats.program}</p>
                  </div>
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Layers className="size-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Only</p>
                    <p className="text-2xl font-bold mt-1">{stats.teamOnly}</p>
                  </div>
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="size-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        {!isLoading && teams && teams.documents.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value={TeamVisibility.ALL}>All Members</SelectItem>
                <SelectItem value={TeamVisibility.PROGRAM_ONLY}>Program Only</SelectItem>
                <SelectItem value={TeamVisibility.TEAM_ONLY}>Team Only</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="grid" className="gap-2">
                  <Grid3x3 className="size-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="size-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTeams.length === 0 && teams?.documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users2 className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Create your first team to start organizing your workspace and collaborating with members
            </p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : filteredTeams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground text-center max-w-sm text-sm">
              Try adjusting your search or filters to find what you're looking for
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredTeams.map((team) => {
            const VisibilityIcon = getVisibilityIcon(team.visibility);
            
            return viewMode === "grid" ? (
              <Card 
                key={team.$id} 
                className="group hover:shadow-md transition-all duration-200 overflow-hidden border-border/40 hover:border-border"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="size-12 rounded-lg border">
                        {team.imageUrl ? (
                          <AvatarImage src={team.imageUrl} alt={team.name} />
                        ) : (
                          <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white font-semibold">
                            {team.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-semibold text-base truncate">
                          {team.name}
                        </h3>
                        <Badge className={cn("text-xs font-normal", getVisibilityColor(team.visibility))}>
                          <VisibilityIcon className="size-3 mr-1" />
                          {getVisibilityLabel(team.visibility)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="size-8 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(team.$id)}>
                          <Pencil className="size-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(team.$id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {team.description || "No description provided"}
                  </p>
                </CardContent>

                <CardFooter className="pt-4 border-t bg-muted/5">
                  <Link 
                    href={`/workspaces/${workspaceId}/teams/${team.$id}`}
                    className="flex items-center justify-between w-full group/link"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="size-4" />
                      <span>View team space</span>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardFooter>
              </Card>
            ) : (
              // List View
              <Card 
                key={team.$id} 
                className="group hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16 rounded-lg border flex-shrink-0">
                      {team.imageUrl ? (
                        <AvatarImage src={team.imageUrl} alt={team.name} />
                      ) : (
                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white font-bold text-xl">
                          {team.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{team.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {team.description || "No description provided"}
                          </p>
                        </div>
                        <Badge className={cn("text-xs font-normal shrink-0", getVisibilityColor(team.visibility))}>
                          <VisibilityIcon className="size-3 mr-1" />
                          {getVisibilityLabel(team.visibility)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/workspaces/${workspaceId}/teams/${team.$id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Shield className="size-4" />
                          View Space
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-9">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(team.$id)}>
                            <Pencil className="size-4 mr-2" />
                            Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(team.$id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
