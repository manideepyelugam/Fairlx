"use client";

import { useState } from "react";
import {
  Flag,
  ChevronDown,
  ChevronRight,
  Users,
  Layers,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useUpdateWorkItem } from "../api/use-update-work-item";
import { WorkItemOptionsMenu } from "./work-item-options-menu";
import { AssignAssigneeDialog } from "./assign-assignee-dialog";
import { AssignEpicDialog } from "./assign-epic-dialog";
import { SplitWorkItemDialog } from "./split-work-item-dialog";
import {
  PopulatedWorkItem,
  WorkItemStatus,
  WorkItemPriority,
  WorkItemType,
} from "../types";

interface WorkItemCardProps {
  workItem: PopulatedWorkItem;
  workspaceId: string;
  projectId?: string;
  onViewDetails?: () => void;
}

const typeColors = {
  [WorkItemType.STORY]: "bg-blue-500",
  [WorkItemType.BUG]: "bg-red-500",
  [WorkItemType.TASK]: "bg-green-500",
  [WorkItemType.EPIC]: "bg-purple-500",
  [WorkItemType.SUBTASK]: "bg-gray-500",
};

const priorityColors = {
  [WorkItemPriority.LOW]: "text-gray-500",
  [WorkItemPriority.MEDIUM]: "text-yellow-500",
  [WorkItemPriority.HIGH]: "text-orange-500",
  [WorkItemPriority.URGENT]: "text-red-500",
};

export const WorkItemCard = ({ workItem, workspaceId, projectId, onViewDetails }: WorkItemCardProps) => {
  const [showChildren, setShowChildren] = useState(false);
  const [editingStoryPoints, setEditingStoryPoints] = useState(false);
  const [assignAssigneeOpen, setAssignAssigneeOpen] = useState(false);
  const [assignEpicOpen, setAssignEpicOpen] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const { mutate: updateWorkItem } = useUpdateWorkItem();

  const handleStatusChange = (status: string) => {
    updateWorkItem({
      param: { workItemId: workItem.$id },
      json: { status: status as WorkItemStatus },
    });
  };

  const handleStoryPointsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const points = formData.get("storyPoints") as string;
    updateWorkItem({
      param: { workItemId: workItem.$id },
      json: { storyPoints: parseInt(points) || 0 },
    });
    setEditingStoryPoints(false);
  };

  return (
    <div className="group border rounded-lg p-2.5 bg-background hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2.5">
        {/* Type Indicator */}
        <div
          className={cn(
            "w-1 h-full rounded-full",
            typeColors[workItem.type]
          )}
        />

        <div className="flex-1 space-y-1.5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              {workItem.childrenCount! > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChildren(!showChildren)}
                  className="h-6 w-6 p-0"
                >
                  {showChildren ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </Button>
              )}
              <button
                onClick={onViewDetails}
                className="text-sm font-medium hover:underline text-left"
              >
                {workItem.key}: {workItem.title}
              </button>
              {workItem.flagged && (
                <Flag className="size-4 fill-red-500 text-red-500" />
              )}
            </div>
            <WorkItemOptionsMenu
              workItem={workItem}
              onSplit={() => setSplitDialogOpen(true)}
              onAssignEpic={() => setAssignEpicOpen(true)}
              onAssignAssignee={() => setAssignAssigneeOpen(true)}
              onEditStoryPoints={() => setEditingStoryPoints(true)}
            />
          </div>

          {/* Epic Badge */}
          {workItem.epic && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="size-3" />
              <span>{workItem.epic.key}: {workItem.epic.title}</span>
            </div>
          )}

          {/* Controls Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown */}
            <Select
              value={workItem.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WorkItemStatus.TODO}>To Do</SelectItem>
                <SelectItem value={WorkItemStatus.IN_PROGRESS}>
                  In Progress
                </SelectItem>
                <SelectItem value={WorkItemStatus.IN_REVIEW}>
                  In Review
                </SelectItem>
                <SelectItem value={WorkItemStatus.DONE}>Done</SelectItem>
                <SelectItem value={WorkItemStatus.BLOCKED}>Blocked</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Badge */}
            <Badge variant="outline" className={cn("text-xs", priorityColors[workItem.priority])}>
              {workItem.priority}
            </Badge>

            {/* Story Points */}
            {editingStoryPoints ? (
              <form onSubmit={handleStoryPointsSubmit} className="flex items-center gap-1">
                <Input
                  name="storyPoints"
                  type="number"
                  defaultValue={workItem.storyPoints || 0}
                  className="h-7 w-16 text-xs"
                  autoFocus
                  onBlur={() => setEditingStoryPoints(false)}
                />
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setEditingStoryPoints(true)}
              >
                {workItem.storyPoints || 0} pts
              </Button>
            )}

            {/* Assignees */}
            {workItem.assignees && workItem.assignees.length > 0 ? (
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center -space-x-2 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                    onMouseEnter={() => setAssigneePopoverOpen(true)}
                    onMouseLeave={() => setAssigneePopoverOpen(false)}
                    onClick={() => setAssignAssigneeOpen(true)}
                  >
                    {workItem.assignees.slice(0, 3).map((assignee) => (
                      <Avatar key={assignee.$id} className="size-6 border-2 border-background">
                        <AvatarImage src={assignee.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {assignee.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {workItem.assignees.length > 3 && (
                      <div className="flex items-center justify-center size-6 rounded-full bg-muted border-2 border-background text-xs">
                        +{workItem.assignees.length - 3}
                      </div>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  className="w-64 p-3"
                  onMouseEnter={() => setAssigneePopoverOpen(true)}
                  onMouseLeave={() => setAssigneePopoverOpen(false)}
                >
                  <div className="space-y-2">
                    {workItem.assignees.map((assignee) => (
                      <div key={assignee.$id} className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarImage src={assignee.profileImageUrl || undefined} />
                          <AvatarFallback className="text-sm">
                            {assignee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">
                            {assignee.name}
                          </span>
                          {assignee.email && (
                            <span className="text-xs text-muted-foreground">
                              {assignee.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={() => setAssignAssigneeOpen(true)}
              >
                <Users className="size-3" />
              </Button>
            )}

            {/* Children Count */}
            {workItem.childrenCount! > 0 && (
              <Badge variant="secondary" className="text-xs">
                {workItem.childrenCount} subtasks
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Children (if expanded) */}
      {showChildren && workItem.children && workItem.children.length > 0 && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 pl-3">
          {workItem.children.map((child) => (
            <WorkItemCard 
              key={child.$id} 
              workItem={child} 
              workspaceId={workspaceId}
              projectId={projectId}
              onViewDetails={onViewDetails} 
            />
          ))}
        </div>
      )}

      {/* Assign Assignee Dialog */}
      <AssignAssigneeDialog
        isOpen={assignAssigneeOpen}
        onClose={() => setAssignAssigneeOpen(false)}
        workItem={workItem}
        workspaceId={workspaceId}
      />

      {/* Assign Epic Dialog */}
      {projectId && (
        <AssignEpicDialog
          open={assignEpicOpen}
          onClose={() => setAssignEpicOpen(false)}
          workItem={workItem}
          workspaceId={workspaceId}
          projectId={projectId}
        />
      )}

      {/* Split Work Item Dialog */}
      <SplitWorkItemDialog
        workItem={workItem}
        open={splitDialogOpen}
        onClose={() => setSplitDialogOpen(false)}
      />
    </div>
  );
};
