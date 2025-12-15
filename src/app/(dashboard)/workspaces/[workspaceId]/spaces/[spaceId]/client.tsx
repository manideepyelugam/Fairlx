"use client";

import { useParams, useRouter } from "next/navigation";
import { Settings, Users, Workflow, Plus, FolderKanban, ChevronRight, FolderPlus, X } from "lucide-react";
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
import { useConfirm } from "@/hooks/use-confirm";

export const SpaceIdClient = () => {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const workspaceId = useWorkspaceId();
  const { open: openCreateProject } = useCreateProjectModal();
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const [ConfirmDialog, confirm] = useConfirm(
    "Remove Project",
    "Are you sure you want to remove this project from the space? The project will not be deleted, just unassigned from this space.",
    "destructive"
  );
  
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
    
    // Debug: Log all projects with their spaceId
    console.log("All projects:", projectsData.documents.map(p => ({
      name: p.name,
      spaceId: p.spaceId,
      spaceIdType: typeof p.spaceId,
      isNull: p.spaceId === null,
      isUndefined: p.spaceId === undefined,
      isEmpty: p.spaceId === "",
    })));
    
    return projectsData.documents.filter(project => {
      // Check if project has no space assigned (null, undefined, or empty string)
      return !project.spaceId || project.spaceId === null || project.spaceId === "";
    });
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

  const handleRemoveProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm();
    if (!ok) return;
    
    updateProject(
      {
        param: { projectId },
        form: { spaceId: null },
      }
    );
  };

  return (
    <div className="flex flex-col gap-y-4">
      <ConfirmDialog />
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
                <Button onClick={handleCreateProject} size="sm" variant="default">
                  <Plus className="size-4 mr-2" />
                  Create Project
                </Button>
                <Button onClick={() => setIsAddProjectOpen(true)} size="sm" variant="secondary">
                  <FolderPlus className="size-4 mr-2" />
                  Add Existing
                </Button>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {spaceProjects.map((project) => (
                <Card
                  key={project.$id}
                  className="group relative cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-primary/20"
                  onClick={() => handleProjectClick(project.$id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <ProjectAvatar
                        name={project.name}
                        image={project.imageUrl}
                        className="size-12 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </h4>
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive flex-shrink-0 -mt-1 -mr-1"
                              disabled={isUpdating}
                              onClick={(e) => handleRemoveProject(project.$id, e)}
                              title="Remove from space"
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 absolute bottom-3 right-3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Existing Project Dialog */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Existing Project to {space.name}</DialogTitle>
            <DialogDescription>
              Select a project to assign to this space. Only projects that haven't been assigned to any space are shown here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
            {availableProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FolderKanban className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Available Projects</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  All projects in this workspace are already assigned to spaces. Create a new project or remove a project from its current space to assign it here.
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground px-1">
                  {availableProjects.length} {availableProjects.length === 1 ? 'project' : 'projects'} available
                </div>
                {availableProjects.map((project) => (
                  <Card
                    key={project.$id}
                    className="group cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-primary/20"
                    onClick={() => handleAddExistingProject(project.$id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ProjectAvatar
                            name={project.name}
                            image={project.imageUrl}
                            className="size-12 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                              {project.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {project.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isUpdating}
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddExistingProject(project.$id);
                          }}
                        >
                          <Plus className="size-4 mr-1" />
                          Add to Space
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};;
