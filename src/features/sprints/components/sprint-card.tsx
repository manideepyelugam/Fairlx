"use client";

import { Calendar, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { SprintOptionsMenu } from "./sprint-options-menu";
import { CreateWorkItemBar } from "./create-work-item-bar";
import { WorkItemCard } from "./work-item-card";
import { useGetWorkItems } from "../api/use-get-work-items";
import { PopulatedSprint, SprintStatus } from "../types";
import { cn } from "@/lib/utils";

interface SprintCardProps {
  sprint: PopulatedSprint;
  workspaceId: string;
  projectId: string;
}

const statusColors = {
  [SprintStatus.PLANNED]: "bg-gray-500",
  [SprintStatus.ACTIVE]: "bg-green-500",
  [SprintStatus.COMPLETED]: "bg-blue-500",
};

export const SprintCard = ({
  sprint,
  workspaceId,
  projectId,
}: SprintCardProps) => {
  const [isExpanded, setIsExpanded] = useState(sprint.status === SprintStatus.ACTIVE);

  const { data: workItemsData } = useGetWorkItems({
    workspaceId,
    projectId,
    sprintId: sprint.$id,
    includeChildren: true,
  });

  const workItems = workItemsData?.documents || [];
  const completionPercentage = sprint.totalPoints
    ? Math.round((sprint.completedPoints! / sprint.totalPoints) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 px-2"
              >
                <CardTitle className="text-lg">{sprint.name}</CardTitle>
              </Button>
              <Badge className={cn("text-white", statusColors[sprint.status])}>
                {sprint.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {sprint.startDate && sprint.endDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  <span>
                    {formatDistanceToNow(new Date(sprint.startDate), {
                      addSuffix: false,
                    })}{" "}
                    remaining
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Target className="size-4" />
                <span>{sprint.workItemCount || 0} items</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="size-4" />
                <span>
                  {sprint.completedPoints || 0} / {sprint.totalPoints || 0} points
                </span>
              </div>
            </div>

            {sprint.goal && (
              <p className="mt-2 text-sm text-muted-foreground">{sprint.goal}</p>
            )}

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Sprint Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </div>

          <SprintOptionsMenu sprint={sprint} />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Create Work Item Bar */}
          <CreateWorkItemBar
            workspaceId={workspaceId}
            projectId={projectId}
            sprintId={sprint.$id}
          />

          {/* Work Items List */}
          {workItems.length > 0 ? (
            <div className="space-y-2">
              {workItems.map((workItem) => (
                <WorkItemCard key={workItem.$id} workItem={workItem} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No work items yet. Add one to get started.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
