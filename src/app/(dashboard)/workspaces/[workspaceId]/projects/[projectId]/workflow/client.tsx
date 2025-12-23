"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, GitBranch, Settings, Workflow, Info } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { useUpdateProject } from "@/features/projects/api/use-update-project";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetWorkflows } from "@/features/workflows/api/use-get-workflows";
import { useGetWorkflow } from "@/features/workflows/api/use-get-workflow";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useCreateWorkflowModal } from "@/features/workflows/hooks/use-create-workflow-modal";
import { CreateWorkflowModal } from "@/features/workflows/components/create-workflow-modal";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { StatusType, STATUS_TYPE_CONFIG } from "@/features/workflows/types";

export const ProjectWorkflowClient = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const workspaceId = useWorkspaceId();
  const { open: openCreateWorkflow } = useCreateWorkflowModal();

  const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });
  const { data: workflowsData, isLoading: isLoadingWorkflows } = useGetWorkflows({ workspaceId });
  const { data: projectWorkflow } = useGetWorkflow({ 
    workflowId: project?.workflowId || "" 
  });
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { isAdmin } = useCurrentMember({ workspaceId });

  const [isSelectWorkflowOpen, setIsSelectWorkflowOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");

  const workflows = useMemo(() => workflowsData?.documents ?? [], [workflowsData]);

  // Get space workflows if project belongs to a space
  const spaceWorkflows = useMemo(() => {
    if (!project?.spaceId) return [];
    return workflows.filter(w => w.spaceId === project.spaceId);
  }, [workflows, project?.spaceId]);

  // Get workspace-level workflows
  const workspaceWorkflows = useMemo(() => {
    return workflows.filter(w => !w.spaceId && !w.projectId);
  }, [workflows]);

  if (isLoadingProject || isLoadingWorkflows) {
    return <PageLoader />;
  }

  if (!project) {
    return <PageError message="Project not found." />;
  }

  const handleAssignWorkflow = () => {
    if (!selectedWorkflowId) return;

    updateProject(
      {
        param: { projectId },
        form: { workflowId: selectedWorkflowId },
      },
      {
        onSuccess: () => {
          setIsSelectWorkflowOpen(false);
          setSelectedWorkflowId("");
        },
      }
    );
  };

  const handleRemoveWorkflow = () => {
    updateProject({
      param: { projectId },
      form: { workflowId: "" },
    });
  };

  const handleCreateProjectWorkflow = () => {
    openCreateWorkflow();
  };

  const handleEditWorkflow = (workflowId: string) => {
    if (project.spaceId) {
      router.push(`/workspaces/${workspaceId}/spaces/${project.spaceId}/workflows/${workflowId}`);
    } else {
      router.push(`/workspaces/${workspaceId}/workflows/${workflowId}`);
    }
  };

  return (
    <div className="flex flex-col gap-y-6 max-w-4xl mx-auto">
      <CreateWorkflowModal workspaceId={workspaceId} projectId={projectId} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/workspaces/${workspaceId}/projects/${projectId}`}>
            <Button variant="ghost" size="icon" className="size-9">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ProjectAvatar
              name={project.name}
              image={project.imageUrl}
              className="size-12"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Project Workflow
                {project.key && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {project.key}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure workflow for {project.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Current Workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="size-5 text-primary" />
              <CardTitle>Current Workflow</CardTitle>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                {project.workflowId ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditWorkflow(project.workflowId!)}
                      className="gap-2"
                    >
                      <Settings className="size-4" />
                      Edit Workflow
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsSelectWorkflowOpen(true)}
                      className="gap-2"
                    >
                      <Workflow className="size-4" />
                      Change
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => setIsSelectWorkflowOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Assign Workflow
                  </Button>
                )}
              </div>
            )}
          </div>
          <CardDescription>
            The workflow defines the statuses and transitions for work items in this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.workflowId && projectWorkflow ? (
            <div className="space-y-4">
              {/* Workflow Info */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GitBranch className="size-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{projectWorkflow.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {projectWorkflow.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {projectWorkflow.statuses?.length || 0} Statuses
                  </Badge>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleRemoveWorkflow}
                      disabled={isUpdating}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Statuses Preview */}
              {projectWorkflow.statuses && projectWorkflow.statuses.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">Statuses</h5>
                  <div className="flex flex-wrap gap-2">
                    {projectWorkflow.statuses.map((status) => (
                      <div
                        key={status.$id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background"
                        style={{ borderColor: status.color }}
                      >
                        <div 
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm font-medium">{status.name}</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {STATUS_TYPE_CONFIG[status.statusType as StatusType]?.label || status.statusType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <div className="rounded-full bg-muted p-4 mb-4">
                <GitBranch className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Workflow Assigned</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                This project doesn&apos;t have a workflow assigned. Work items will use default statuses.
                {isAdmin && " Assign a workflow to define custom statuses and transitions."}
              </p>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Button onClick={() => setIsSelectWorkflowOpen(true)} className="gap-2">
                    <Plus className="size-4" />
                    Assign Workflow
                  </Button>
                  <Button variant="outline" onClick={handleCreateProjectWorkflow} className="gap-2">
                    <Plus className="size-4" />
                    Create New
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How Project Workflows Work</AlertTitle>
        <AlertDescription className="text-sm">
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Each project can have its own dedicated workflow</li>
            <li>When you create a new status in the project, it will be added to this workflow</li>
            <li>You can also use a shared workflow from the space or workspace</li>
            <li>Work items will only be able to move between statuses defined in the workflow</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Available Workflows */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Workflow className="size-5 text-primary" />
            <CardTitle>Available Workflows</CardTitle>
          </div>
          <CardDescription>
            Workflows you can assign to this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {spaceWorkflows.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium flex items-center gap-2">
                <Badge variant="outline" className="font-normal">Space</Badge>
                Workflows from Space
              </h5>
              <div className="grid gap-3 md:grid-cols-2">
                {spaceWorkflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.$id}
                    workflow={workflow}
                    isActive={project.workflowId === workflow.$id}
                    isAdmin={isAdmin}
                    onSelect={() => {
                      setSelectedWorkflowId(workflow.$id);
                      setIsSelectWorkflowOpen(true);
                    }}
                    onEdit={() => handleEditWorkflow(workflow.$id)}
                  />
                ))}
              </div>
            </div>
          )}

          {workspaceWorkflows.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium flex items-center gap-2">
                <Badge variant="outline" className="font-normal">Workspace</Badge>
                Global Workflows
              </h5>
              <div className="grid gap-3 md:grid-cols-2">
                {workspaceWorkflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.$id}
                    workflow={workflow}
                    isActive={project.workflowId === workflow.$id}
                    isAdmin={isAdmin}
                    onSelect={() => {
                      setSelectedWorkflowId(workflow.$id);
                      setIsSelectWorkflowOpen(true);
                    }}
                    onEdit={() => handleEditWorkflow(workflow.$id)}
                  />
                ))}
              </div>
            </div>
          )}

          {workflows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No workflows available. Create one to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Select/Assign Workflow Dialog */}
      <Dialog open={isSelectWorkflowOpen} onOpenChange={setIsSelectWorkflowOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="size-5" />
              Assign Workflow
            </DialogTitle>
            <DialogDescription>
              Select a workflow to use for this project
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a workflow..." />
              </SelectTrigger>
              <SelectContent>
                {spaceWorkflows.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Space Workflows
                    </div>
                    {spaceWorkflows.map((workflow) => (
                      <SelectItem key={workflow.$id} value={workflow.$id}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="size-4" />
                          {workflow.name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {workspaceWorkflows.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Workspace Workflows
                    </div>
                    {workspaceWorkflows.map((workflow) => (
                      <SelectItem key={workflow.$id} value={workflow.$id}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="size-4" />
                          {workflow.name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSelectWorkflowOpen(false);
                  setSelectedWorkflowId("");
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignWorkflow} 
                disabled={!selectedWorkflowId || isUpdating}
                className="gap-2"
              >
                {isUpdating ? "Assigning..." : "Assign Workflow"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Workflow Card Component
interface WorkflowCardProps {
  workflow: {
    $id: string;
    name: string;
    key: string;
    description?: string | null;
    isDefault?: boolean;
    statusCount?: number;
  };
  isActive: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

const WorkflowCard = ({ workflow, isActive, isAdmin, onSelect, onEdit }: WorkflowCardProps) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'border-primary ring-1 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="size-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{workflow.name}</h4>
                {isActive && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
                {workflow.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {workflow.description || "No description"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <Badge variant="outline" className="text-xs">
            {workflow.statusCount || 0} statuses
          </Badge>
          {isAdmin && !isActive && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              Use This
            </Button>
          )}
          {isAdmin && isActive && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
