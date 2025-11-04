"use client";

import { Layers, ChevronDown, ChevronRight, Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { PopulatedWorkItem } from "../types";
import { WorkItemCard } from "./work-item-card";
import { WorkItemOptionsMenu } from "./work-item-options-menu";

interface EpicCardProps {
  epic: PopulatedWorkItem;
  workspaceId: string;
  childWorkItems?: PopulatedWorkItem[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const priorityColors = {
  LOW: "text-gray-500 border-gray-300",
  MEDIUM: "text-yellow-600 border-yellow-300",
  HIGH: "text-orange-600 border-orange-300",
  URGENT: "text-red-600 border-red-300",
};

const statusColors = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-purple-100 text-purple-700",
  DONE: "bg-green-100 text-green-700",
  BLOCKED: "bg-red-100 text-red-700",
};

export const EpicCard = ({
  epic,
  workspaceId,
  childWorkItems = [],
  isExpanded = false,
  onToggleExpand,
}: EpicCardProps) => {
  // Calculate progress
  const totalChildren = childWorkItems.length;
  const completedChildren = childWorkItems.filter((item) => item.status === "DONE").length;
  const progressPercentage = totalChildren > 0 ? (completedChildren / totalChildren) * 100 : 0;

  return (
    <div className="border rounded-lg bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow">
      {/* Epic Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Epic Icon */}
          <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
            <Layers className="size-5 text-purple-600" />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-purple-500/20 text-purple-700 border-purple-300 shrink-0">
                      {epic.key}
                    </Badge>
                    {epic.flagged && (
                      <Flag className="size-4 fill-red-500 text-red-500 shrink-0" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {epic.title}
                  </h3>
                  {epic.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {epic.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <WorkItemOptionsMenu
                workItem={epic}
                onSplit={() => {}}
                onAssignEpic={() => {}}
                onAssignAssignee={() => {}}
                onEditStoryPoints={() => {}}
              />
            </div>

            {/* Meta Information */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn("text-xs", statusColors[epic.status])}>
                {epic.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", priorityColors[epic.priority])}>
                {epic.priority}
              </Badge>
              {epic.storyPoints && epic.storyPoints > 0 && (
                <span className="text-xs text-muted-foreground">
                  {epic.storyPoints} points
                </span>
              )}
            </div>

            {/* Progress Section */}
            {totalChildren > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Progress: {completedChildren} of {totalChildren} items completed
                  </span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}

            {/* Toggle Children Button */}
            {totalChildren > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="w-full justify-start gap-2 text-sm"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="size-4" />
                    Hide {totalChildren} work {totalChildren === 1 ? "item" : "items"}
                  </>
                ) : (
                  <>
                    <ChevronRight className="size-4" />
                    Show {totalChildren} work {totalChildren === 1 ? "item" : "items"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Child Work Items */}
      {isExpanded && totalChildren > 0 && (
        <div className="border-t bg-white/50 p-4 space-y-2">
          {childWorkItems.map((workItem) => (
            <WorkItemCard
              key={workItem.$id}
              workItem={workItem}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
