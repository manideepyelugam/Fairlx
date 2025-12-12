"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, GitBranch, Settings, Trash2, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCurrentMember } from "@/features/members/hooks/use-current-member";
import { useGetWorkflow } from "@/features/workflows/api/use-get-workflow";
import { useGetWorkflowStatuses } from "@/features/workflows/api/use-get-workflow-statuses";
import { useDeleteWorkflow } from "@/features/workflows/api/use-delete-workflow";
import { useConfirm } from "@/hooks/use-confirm";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";

export const WorkflowDetailClient = () => {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.workflowId as string;
  const spaceId = params.spaceId as string;
  const workspaceId = useWorkspaceId();
  const { isAdmin } = useCurrentMember({ workspaceId });

  const { data: workflow, isLoading: workflowLoading } = useGetWorkflow({ workflowId });
  const { data: statusesData, isLoading: statusesLoading } = useGetWorkflowStatuses({ workflowId });
  const { mutate: deleteWorkflow, isPending: isDeleting } = useDeleteWorkflow();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Workflow",
    "Are you sure you want to delete this workflow? This action cannot be undone.",
    "destructive"
  );

  const statuses = statusesData?.documents ?? [];

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;

    deleteWorkflow(
      { param: { workflowId } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${workspaceId}/spaces/${spaceId}/workflows`);
        },
      }
    );
  };

  if (workflowLoading || statusesLoading) {
    return <PageLoader />;
  }

  if (!workflow) {
    return <PageError message="Workflow not found" />;
  }

  return (
    <div className="flex flex-col gap-y-4">
      <DeleteDialog />

      <div className="flex items-center gap-4 mb-2">
        <Link href={`/workspaces/${workspaceId}/spaces/${spaceId}/workflows`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <GitBranch className="size-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{workflow.name}</h1>
              {workflow.isDefault && (
                <Badge variant="secondary">Default</Badge>
              )}
              {workflow.isSystem && (
                <Badge variant="outline">System</Badge>
              )}
            </div>
            {workflow.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {workflow.description}
              </p>
            )}
          </div>
        </div>
        {isAdmin && !workflow.isSystem && (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Workflow Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Workflow Key</p>
              <p className="font-mono text-sm">{workflow.key}</p>
            </div>
            {workflow.workspaceId && (
              <div>
                <p className="text-sm text-muted-foreground">Workspace</p>
                <p className="text-sm">Workspace Level</p>
              </div>
            )}
            {workflow.spaceId && (
              <div>
                <p className="text-sm text-muted-foreground">Space</p>
                <p className="text-sm">Space Level</p>
              </div>
            )}
            {workflow.projectId && (
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="text-sm">Project Level</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Statuses</p>
              <p className="text-2xl font-bold">{statuses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Statuses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Workflow Statuses</CardTitle>
            <CardDescription>
              Statuses define the stages work items can be in
            </CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              Add Status
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {statuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Settings className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No statuses configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add statuses to define the workflow stages
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {statuses.map((status, index) => (
                <div
                  key={status.$id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      {index + 1}
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <div>
                      <p className="font-medium">{status.name}</p>
                      {status.description && (
                        <p className="text-sm text-muted-foreground">
                          {status.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {status.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
