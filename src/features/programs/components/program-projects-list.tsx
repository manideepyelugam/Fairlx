"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Unlink,
  ExternalLink,
  Search,
  MoreHorizontal,
  FolderKanban,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useConfirm } from "@/hooks/use-confirm";
import { useGetProgramProjects } from "../api/use-get-program-projects";
import { useGetAvailableProjects } from "../api/use-get-available-projects";
import { useLinkProjectToProgram } from "../api/use-link-project-to-program";
import { useUnlinkProjectFromProgram } from "../api/use-unlink-project-from-program";
import { LinkedProject } from "../types";

interface ProgramProjectsListProps {
  programId: string;
  workspaceId: string;
  canManage?: boolean;
}

export const ProgramProjectsList = ({
  programId,
  workspaceId,
  canManage = false,
}: ProgramProjectsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [availableSearchQuery, setAvailableSearchQuery] = useState("");

  const { data: projectsData, isLoading: isLoadingProjects } = useGetProgramProjects({ programId });
  const { data: availableData, isLoading: isLoadingAvailable } = useGetAvailableProjects({ programId });
  const { mutate: linkProject, isPending: isLinking } = useLinkProjectToProgram();
  const { mutate: unlinkProject, isPending: isUnlinking } = useUnlinkProjectFromProgram();

  const [UnlinkDialog, confirmUnlink] = useConfirm(
    "Unlink Project",
    "Are you sure you want to unlink this project from the program?",
    "destructive"
  );

  const projects = projectsData?.data?.documents || [];
  const availableProjects = useMemo(() => {
    const available = availableData?.data?.documents?.filter(
      (p: { isLinked: boolean }) => !p.isLinked
    ) || [];
    
    if (!availableSearchQuery) return available;
    
    return available.filter((project: { name: string; key?: string }) =>
      project.name.toLowerCase().includes(availableSearchQuery.toLowerCase()) ||
      project.key?.toLowerCase().includes(availableSearchQuery.toLowerCase())
    );
  }, [availableData?.data?.documents, availableSearchQuery]);

  // Filter projects by search
  const filteredProjects = projects.filter((project: LinkedProject) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.key?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLinkProject = (projectId: string) => {
    linkProject(
      { programId, projectId },
      {
        onSuccess: () => {
          setLinkDialogOpen(false);
          setAvailableSearchQuery("");
        },
      }
    );
  };

  const handleUnlinkProject = async (projectId: string, _projectName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = _projectName; // Reserved for future confirmation dialog enhancement
    const ok = await confirmUnlink();
    if (!ok) return;

    unlinkProject({ programId, projectId });
  };

  if (isLoadingProjects) {
    return <ProjectsListSkeleton />;
  }

  return (
    <>
      <UnlinkDialog />
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Linked Projects
              <Badge variant="secondary" className="ml-2">
                {projects.length}
              </Badge>
            </CardTitle>

            {canManage && (
              <Dialog open={linkDialogOpen} onOpenChange={(open) => {
                setLinkDialogOpen(open);
                if (!open) setAvailableSearchQuery("");
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Link Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Link Project to Program</DialogTitle>
                    <DialogDescription>
                      Select a project to link to this program. Projects can only be linked to one program at a time.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {isLoadingAvailable ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableData?.data?.documents?.filter((p: { isLinked: boolean }) => !p.isLinked).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No available projects to link</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        All projects are either already linked to this program or another program.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search projects..."
                          value={availableSearchQuery}
                          onChange={(e) => setAvailableSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <ScrollArea className="h-[300px]">
                        {availableProjects.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No projects found.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {availableProjects.map((project: { $id: string; name: string; key?: string; imageUrl?: string }) => (
                              <button
                                key={project.$id}
                                onClick={() => handleLinkProject(project.$id)}
                                disabled={isLinking}
                                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
                              >
                                {project.imageUrl ? (
                                  <Image
                                    src={project.imageUrl}
                                    alt={project.name}
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                      {project.name[0]?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{project.name}</p>
                                  {project.key && (
                                    <p className="text-xs text-muted-foreground">{project.key}</p>
                                  )}
                                </div>
                                {isLinking && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {projects.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No projects linked</p>
              <p className="text-sm text-muted-foreground mt-1">
                Link projects to this program to track them together.
              </p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setLinkDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Link First Project
                </Button>
              )}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No projects match &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project: LinkedProject) => (
                <ProjectCard
                  key={project.$id}
                  project={project}
                  workspaceId={workspaceId}
                  canManage={canManage}
                  onUnlink={() => handleUnlinkProject(project.$id, project.name)}
                  isUnlinking={isUnlinking}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

// Individual project card
interface ProjectCardProps {
  project: LinkedProject;
  workspaceId: string;
  canManage: boolean;
  onUnlink: () => void;
  isUnlinking: boolean;
}

const ProjectCard = ({
  project,
  workspaceId,
  canManage,
  onUnlink,
  isUnlinking,
}: ProjectCardProps) => {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    COMPLETED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    ARCHIVED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    ON_HOLD: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold">
              {project.name[0]?.toUpperCase()}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{project.name}</p>
            {project.key && (
              <Badge variant="outline" className="text-xs">
                {project.key}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className={cn("text-xs", statusColors[project.status] || statusColors.ACTIVE)}>
              {project.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {project.completedTaskCount}/{project.taskCount} tasks
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2 w-32">
          <Progress value={project.progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground w-8 text-right">
            {project.progress}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Project
              </a>
            </DropdownMenuItem>
            {canManage && (
              <DropdownMenuItem
                onClick={onUnlink}
                className="text-destructive"
                disabled={isUnlinking}
              >
                <Unlink className="mr-2 h-4 w-4" />
                Unlink from Program
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// Loading skeleton
const ProjectsListSkeleton = () => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-10 w-full mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </CardContent>
  </Card>
);
