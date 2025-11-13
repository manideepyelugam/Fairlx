"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DottedSeparator } from "@/components/dotted-separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Loader, Users, X } from "lucide-react";
import { useState } from "react";

import { useGetTeams } from "@/features/teams/api/use-get-teams";
import { useAssignProjectToTeam } from "../api/use-assign-project-to-team";
import { useUnassignProjectFromTeam } from "../api/use-unassign-project-from-team";
import { Project } from "../types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectTeamAssignmentProps {
  project: Project;
  workspaceId: string;
}

export const ProjectTeamAssignment = ({
  project,
  workspaceId,
}: ProjectTeamAssignmentProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: teamsData, isLoading: isLoadingTeams } = useGetTeams({
    workspaceId,
  });

  const { mutate: assignTeam, isPending: isAssigning } =
    useAssignProjectToTeam();
  const { mutate: unassignTeam, isPending: isUnassigning } =
    useUnassignProjectFromTeam();

  const teams = teamsData?.documents || [];
  const assignedTeamIds = project.assignedTeamIds || [];

  // Filter out teams that are already assigned
  const availableTeams = teams.filter(
    (team) => !assignedTeamIds.includes(team.$id)
  );

  const handleAssignTeam = () => {
    if (!selectedTeamId) return;

    assignTeam(
      {
        param: { projectId: project.$id, teamId: selectedTeamId },
      },
      {
        onSuccess: () => {
          setSelectedTeamId("");
        },
      }
    );
  };

  const handleUnassignTeam = (teamId: string) => {
    unassignTeam({
      param: { projectId: project.$id, teamId },
    });
  };

  const getTeamName = (teamId: string) => {
    return teams.find((team) => team.$id === teamId)?.name || "Unknown Team";
  };

  const isPending = isAssigning || isUnassigning;

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardContent className="p-7">
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center gap-x-2">
            <Users className="size-5 text-muted-foreground" />
            <h3 className="font-bold">Team Access</h3>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-6">
                    <Info className="size-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    Assign teams to this project. Only members of assigned teams
                    will be able to view and work on this project. If no teams
                    are assigned, the project is visible to all workspace
                    members.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">
            Control which teams have access to this project. Members of assigned
            teams will be able to view and collaborate on this project.
          </p>

          <DottedSeparator className="my-2" />

          {/* Assigned Teams */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Assigned Teams</h4>
            {assignedTeamIds.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No teams assigned. Project is visible to all workspace members.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedTeamIds.map((teamId) => (
                  <Badge
                    key={teamId}
                    variant="secondary"
                    className="flex items-center gap-x-1 pr-1"
                  >
                    <span>{getTeamName(teamId)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-4 hover:bg-transparent"
                      onClick={() => handleUnassignTeam(teamId)}
                      disabled={isPending}
                    >
                      <X className="size-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DottedSeparator className="my-2" />

          {/* Add Team */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Assign Team</h4>
            {isLoadingTeams ? (
              <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
                <Loader className="size-4 animate-spin" />
                Loading teams...
              </div>
            ) : availableTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {teams.length === 0
                  ? "No teams available. Create a team first to assign it to this project."
                  : "All teams are already assigned to this project."}
              </p>
            ) : (
              <div className="flex items-center gap-x-2">
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a team to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.$id} value={team.$id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignTeam}
                  disabled={!selectedTeamId || isPending}
                  size="sm"
                >
                  {isAssigning ? (
                    <Loader className="size-4 animate-spin" />
                  ) : (
                    "Assign"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
