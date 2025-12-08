"use client";

import { useParams } from "next/navigation";
import { Settings, Users, Workflow, Plus } from "lucide-react";
import Link from "next/link";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetWorkItems, WorkItemCard, useCreateWorkItemModal } from "@/features/sprints";
import type { PopulatedWorkItem } from "@/features/sprints";

export const SpaceIdClient = () => {
  const params = useParams();
  const spaceId = params.spaceId as string;
  const workspaceId = useWorkspaceId();
  const { open: createWorkItem } = useCreateWorkItemModal();
  
  const { data: space, isLoading } = useGetSpace({ spaceId });
  // TODO: Add spaceId filter to work items API when needed
  const { data: workItems, isLoading: isLoadingWorkItems } = useGetWorkItems({ 
    workspaceId
  });

  if (isLoading || isLoadingWorkItems) {
    return <PageLoader />;
  }

  if (!space) {
    return <PageError message="Space not found." />;
  }

  const items = (workItems?.documents || []) as PopulatedWorkItem[];

  return (
    <div className="flex flex-col gap-y-4">
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
          <Button onClick={() => createWorkItem()} size="sm">
            <Plus className="size-4 mr-2" />
            Add Work Item
          </Button>
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

      {/* Show work items for this space */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No work items in this space yet.</p>
            <Button onClick={() => createWorkItem()}>
              <Plus className="size-4 mr-2" />
              Create Work Item
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <WorkItemCard 
              key={item.$id} 
              workItem={item} 
              workspaceId={workspaceId}
              projectId={item.projectId}
            />
          ))
        )}
      </div>
    </div>
  );
};
