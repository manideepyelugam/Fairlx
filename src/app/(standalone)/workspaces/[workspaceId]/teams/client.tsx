"use client";

import { Plus, MoreVertical, Pencil, Trash2, Users2, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const TeamsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: teams, isLoading } = useGetTeams({ workspaceId });
  const { open: openCreate } = useCreateTeamModal();
  const { open: openEdit } = useEditTeamModal();
  const [, setTeamId] = useTeamId();
  const { mutate: deleteTeam } = useDeleteTeam();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Team",
    "This action cannot be undone. All team members will be removed from the team.",
    "destructive"
  );

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
    <div className="w-full flex flex-col gap-y-6">
      <DeleteDialog />
      <CreateTeamModal />
      <EditTeamModal />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace teams and collaborate effectively
          </p>
        </div>
        <Button onClick={openCreate} size="default" className="gap-2">
          <Plus className="size-4" />
          Create Team
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : teams?.documents.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams?.documents.map((team) => (
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
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {team.visibility === TeamVisibility.ALL ? "All Members" : 
                           team.visibility === TeamVisibility.PROGRAM_ONLY ? "Program Only" : 
                           "Team Only"}
                        </Badge>
                      </div>
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
                      <DropdownMenuItem onClick={() => handleEdit(team.$id)}>
                        <Pencil className="size-4 mr-2" />
                        Edit Team
                      </DropdownMenuItem>
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
          ))}
        </div>
      )}
    </div>
  );
};
