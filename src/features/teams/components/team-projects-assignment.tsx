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
import { Briefcase, Info, Loader, X } from "lucide-react";
import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useAssignProjectToTeam } from "@/features/projects/api/use-assign-project-to-team";
import { useUnassignProjectFromTeam } from "@/features/projects/api/use-unassign-project-from-team";
import { Team } from "../types";

interface TeamProjectsAssignmentProps {
  team: Team;
  workspaceId: string;
}

export const TeamProjectsAssignment = ({
  team,
  workspaceId,
}: TeamProjectsAssignmentProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });

  const { mutate: assignProject, isPending: isAssigning } =
    useAssignProjectToTeam();
  const { mutate: unassignProject, isPending: isUnassigning } =
    useUnassignProjectFromTeam();

  const projects = projectsData?.documents || [];

  // Get projects that have this team assigned
  const assignedProjects = projects.filter((project) =>
    project.assignedTeamIds?.includes(team.$id)
  );

  // Get projects that are available to assign (not already assigned to this team)
  const availableProjects = projects.filter(
    (project) => !project.assignedTeamIds?.includes(team.$id)
  );

  const handleAssignProject = () => {
    if (!selectedProjectId) return;

    assignProject(
      {
        param: { projectId: selectedProjectId, teamId: team.$id },
      },
      {
        onSuccess: () => {
          setSelectedProjectId("");
        },
      }
    );
  };

  const handleUnassignProject = (projectId: string) => {
    unassignProject({
      param: { projectId, teamId: team.$id },
    });
  };

  const isPending = isAssigning || isUnassigning;

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardContent className="p-7">
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center gap-x-2">
            <Briefcase className="size-5 text-muted-foreground" />
            <h3 className="font-bold">Assigned Projects</h3>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-6">
                    <Info className="size-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    Assign projects to this team. Team members will be able to
                    view and work on these projects. Projects can be assigned to
                    multiple teams.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage which projects this team has access to. Members will be able
            to view and collaborate on assigned projects.
          </p>

          <DottedSeparator className="my-2" />

          {/* Assigned Projects */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Current Projects</h4>
            {assignedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No projects assigned to this team yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedProjects.map((project) => (
                  <Badge
                    key={project.$id}
                    variant="secondary"
                    className="flex items-center gap-x-1 pr-1"
                  >
                    <span>{project.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-4 hover:bg-transparent"
                      onClick={() => handleUnassignProject(project.$id)}
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

          {/* Add Project */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Assign Project</h4>
            {isLoadingProjects ? (
              <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
                <Loader className="size-4 animate-spin" />
                Loading projects...
              </div>
            ) : availableProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {projects.length === 0
                  ? "No projects available. Create a project first to assign it to this team."
                  : "All projects are already assigned to this team."}
              </p>
            ) : (
              <div className="flex items-center gap-x-2">
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.$id} value={project.$id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignProject}
                  disabled={!selectedProjectId || isPending}
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
