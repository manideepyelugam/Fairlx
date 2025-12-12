"use client";

import { useParams, useRouter } from "next/navigation";
import { Settings, Users, Workflow, Plus, FolderKanban, ChevronRight, FolderPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useUpdateProject } from "@/features/projects/api/use-update-project";

export const SpaceIdClient = () => {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const workspaceId = useWorkspaceId();
  const { open: openCreateProject } = useCreateProjectModal();
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  
  const { data: space, isLoading: isLoadingSpace } = useGetSpace({ spaceId });
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { isAdmin } = useCurrentMember({ workspaceId });

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  // Filter projects that belong to this space
  const spaceProjects = useMemo(() => {
    if (!projectsData?.documents) return [];
    return projectsData.documents.filter(project => project.spaceId === spaceId);
  }, [projectsData, spaceId]);

  // Get all projects without a space (available to add)
  const availableProjects = useMemo(() => {
    if (!projectsData?.documents) return [];
    return projectsData.documents.filter(project => !project.spaceId);
  }, [projectsData]);

  if (isLoadingSpace || isLoadingProjects) {
    return <PageLoader />;
  }

  if (!space) {
    return <PageError message="Space not found." />;
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
  };

  const handleCreateProject = () => {
    // Open create project modal with spaceId pre-filled
    openCreateProject(spaceId);
  };

  const handleAddExistingProject = (projectId: string) => {
    updateProject(
      {
        param: { projectId },
        form: { spaceId },
      },
      {
        onSuccess: () => {
          setIsAddProjectOpen(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-y-4">
      <CreateProjectModal />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: space.color || "#6366f1" }}
          >
            {space.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{space.name}</h1>
              <Badge variant="outline">{space.key}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {space.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/workspaces/${workspaceId}/spaces/${spaceId}/workflows`}>
            <Button variant="outline" size="sm">
              <Workflow className="size-4 mr-2" />
              Workflows
            </Button>
          </Link>
          <Link href={`/workspaces/${workspaceId}/spaces/${spaceId}/members`}>
            <Button variant="outline" size="sm">
              <Users className="size-4 mr-2" />
              Members
            </Button>
          </Link>
          <Link href={`/workspaces/${workspaceId}/spaces/${spaceId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="size-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects in this Space */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Projects in {space.name}</CardTitle>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button onClick={handleCreateProject} size="sm">
                  <Plus className="size-4 mr-2" />
                  Create Project
                </Button>
                {availableProjects.length > 0 && (
                  <Button onClick={() => setIsAddProjectOpen(true)} size="sm" variant="outline">
                    <FolderPlus className="size-4 mr-2" />
                    Add Existing
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {spaceProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                This space doesn&apos;t have any projects yet. Projects help you organize work items and track progress.
                {isAdmin && " Create a new project to get started!"}
              </p>
              {isAdmin && (
                <Button onClick={handleCreateProject}>
                  <Plus className="size-4 mr-2" />
                  Create First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {spaceProjects.map((project) => (
                <Card
                  key={project.$id}
                  className="group cursor-pointer hover:bg-muted/50 transition-colors border-border/50 hover:border-border"
                  onClick={() => handleProjectClick(project.$id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <ProjectAvatar
                          name={project.name}
                          image={project.imageUrl}
                          className="size-10"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {project.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Existing Project Dialog */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Add Existing Project to {space.name}</DialogTitle>
            <DialogDescription>
              Select a project to assign to this space. Only unassigned projects are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
            {availableProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  All projects are already assigned to spaces.
                </p>
              </div>
            ) : (
              availableProjects.map((project) => (
                <Card
                  key={project.$id}
                  className="group cursor-pointer hover:bg-muted/50 transition-colors border-border/50 hover:border-border"
                  onClick={() => handleAddExistingProject(project.$id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <ProjectAvatar
                          name={project.name}
                          image={project.imageUrl}
                          className="size-12"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {project.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isUpdating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddExistingProject(project.$id);
                        }}
                      >
                        <Plus className="size-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};;
