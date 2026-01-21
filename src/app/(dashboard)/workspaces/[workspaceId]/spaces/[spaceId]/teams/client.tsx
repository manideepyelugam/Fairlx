"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  UsersRound, 
  ArrowLeft, 
  Plus, 
  ExternalLink, 
  Crown,
  X
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTeams } from "@/features/teams/api/use-get-teams";
import { useUpdateTeam } from "@/features/teams/api/use-update-team";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useConfirm } from "@/hooks/use-confirm";
import { MasterBadge } from "@/features/spaces/components/space-role-badge";


export const SpaceTeamsClient = () => {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const workspaceId = useWorkspaceId();
  
  // State
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Data fetching
  const { data: space, isLoading: isLoadingSpace } = useGetSpace({ spaceId });
  const { data: spaceTeamsData, isLoading: isLoadingSpaceTeams } = useGetTeams({ workspaceId, spaceId });
  const { data: allTeamsData, isLoading: isLoadingAllTeams } = useGetTeams({ workspaceId });
  const { mutate: updateTeam, isPending: isUpdating } = useUpdateTeam();
  const { isAdmin: isWorkspaceAdmin } = useCurrentMember({ workspaceId });

  // Workspace admins are treated as space masters
  const isMaster = isWorkspaceAdmin;

  const [RemoveDialog, confirmRemove] = useConfirm(
    "Remove Team from Space",
    "This team will be removed from the space but not deleted.",
    "destructive"
  );

  const spaceTeams = useMemo(() => spaceTeamsData?.documents ?? [], [spaceTeamsData]);
  const allTeams = useMemo(() => allTeamsData?.documents ?? [], [allTeamsData]);

  // Get teams without a space (available to add)
  const availableTeams = useMemo(() => {
    return allTeams.filter(team => !team.spaceId || team.spaceId === null || team.spaceId === "" || team.spaceId === "undefined");
  }, [allTeams]);

  // Statistics
  const stats = useMemo(() => {
    const totalMembers = spaceTeams.reduce((acc, team) => acc + (team.memberCount || 0), 0);
    return { totalTeams: spaceTeams.length, totalMembers };
  }, [spaceTeams]);

  if (isLoadingSpace || isLoadingSpaceTeams) {
    return <PageLoader />;
  }

  if (!space) {
    return <PageError message="Space not found." />;
  }

  const handleTeamClick = (teamId: string) => {
    router.push(`/workspaces/${workspaceId}/teams/${teamId}`);
  };

  const handleAddExistingTeam = () => {
    if (!selectedTeamId) return;

    updateTeam(
      {
        param: { teamId: selectedTeamId },
        json: { spaceId },
      },
      {
        onSuccess: () => {
          setIsAddTeamOpen(false);
          setSelectedTeamId("");
        },
      }
    );
  };

  const handleRemoveTeam = async (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirmRemove();
    if (!ok) return;
    
    updateTeam({
      param: { teamId },
      json: { spaceId: null },
    });
  };

  return (
    <div className="flex flex-col gap-y-4 h-full">
      <RemoveDialog />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/workspaces/${workspaceId}/spaces/${spaceId}`}>
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          
          <div 
            className="size-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: space.color || "#6366f1" }}
          >
            {space.name.charAt(0).toUpperCase()}
          </div>
          
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              {space.name} Teams
              {isMaster && <MasterBadge size="sm" />}
            </h1>
            <p className="text-xs text-muted-foreground">
              {stats.totalTeams} teams · {stats.totalMembers} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMaster && (
            <>
              <Link href={`/workspaces/${workspaceId}/members`}>
                <Button variant="outline" size="sm">
                  <Crown className="size-4 mr-1.5" />
                  Manage Members
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddTeamOpen(true)}
              >
                <Plus className="size-4 mr-1.5" />
                Add Team
              </Button>
            </>
          )}
          <Link href={`/workspaces/${workspaceId}/teams`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="size-4 mr-1.5" />
              All Teams
            </Button>
          </Link>
        </div>
      </div>

      {/* Teams List */}
      {spaceTeams.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersRound className="size-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No Teams Yet</h3>
            <p className="text-muted-foreground text-center text-sm mb-4">
              Add teams to this space to get started.
            </p>
            {isMaster && (
              <Button onClick={() => setIsAddTeamOpen(true)} size="sm">
                <Plus className="size-4 mr-1.5" />
                Add Team
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {spaceTeams.map((team) => (
            <Card 
              key={team.$id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleTeamClick(team.$id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: space.color || "#6366f1" }}
                    >
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {team.memberCount || 0} members
                      </p>
                    </div>
                  </div>
                  {isMaster && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleRemoveTeam(team.$id, e)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                {team.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {team.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Team Dialog */}
      <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Team to {space.name}</DialogTitle>
            <DialogDescription>
              Select a team without a space assignment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLoadingAllTeams ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : availableTeams.length === 0 ? (
              <div className="text-center py-6">
                <UsersRound className="size-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No available teams. All teams are already assigned to spaces.
                </p>
              </div>
            ) : (
              <>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.$id} value={team.$id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddTeamOpen(false);
                      setSelectedTeamId("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddExistingTeam} 
                    disabled={!selectedTeamId || isUpdating}
                  >
                    {isUpdating ? "Adding..." : "Add"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
