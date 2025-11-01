"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useGetSprints } from "../api/use-get-sprints";
import { SprintCard } from "./sprint-card";
import { CreateSprintDialog } from "./create-sprint-dialog";
import { SprintStatus } from "../types";

interface SprintBoardProps {
  workspaceId: string;
  projectId: string;
}

export const SprintBoard = ({ workspaceId, projectId }: SprintBoardProps) => {
  const [createSprintOpen, setCreateSprintOpen] = useState(false);

  const { data: sprintsData, isLoading: sprintsLoading } = useGetSprints({
    workspaceId,
    projectId,
  });

  const sprints = sprintsData?.documents || [];

  const activeSprints = sprints.filter((s) => s.status === SprintStatus.ACTIVE);
  const plannedSprints = sprints.filter((s) => s.status === SprintStatus.PLANNED);
  const completedSprints = sprints.filter(
    (s) => s.status === SprintStatus.COMPLETED
  );

  if (sprintsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sprints...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sprint Board</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sprints and work items
          </p>
        </div>
        <Button onClick={() => setCreateSprintOpen(true)}>
          <Plus className="size-4 mr-2" />
          New Sprint
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeSprints.length})
          </TabsTrigger>
          <TabsTrigger value="planned">
            Planned ({plannedSprints.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedSprints.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Sprints */}
        <TabsContent value="active" className="space-y-4">
          {activeSprints.length > 0 ? (
            activeSprints.map((sprint) => (
              <SprintCard
                key={sprint.$id}
                sprint={sprint}
                workspaceId={workspaceId}
                projectId={projectId}
              />
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">
                No active sprints. Create one to get started.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Planned Sprints */}
        <TabsContent value="planned" className="space-y-4">
          {plannedSprints.length > 0 ? (
            plannedSprints.map((sprint) => (
              <SprintCard
                key={sprint.$id}
                sprint={sprint}
                workspaceId={workspaceId}
                projectId={projectId}
              />
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">
                No planned sprints. Create one to start planning.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Completed Sprints */}
        <TabsContent value="completed" className="space-y-4">
          {completedSprints.length > 0 ? (
            completedSprints.map((sprint) => (
              <SprintCard
                key={sprint.$id}
                sprint={sprint}
                workspaceId={workspaceId}
                projectId={projectId}
              />
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">
                No completed sprints yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Sprint Dialog */}
      <CreateSprintDialog
        isOpen={createSprintOpen}
        onClose={() => setCreateSprintOpen(false)}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </div>
  );
};
