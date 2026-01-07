"use client";

import { useState } from "react";
import {
  Flag,
  ChevronDown,
  ChevronRight,
  Users,
  Layers,
  Bookmark,
  Bug,
  CheckSquare,
  ListTodo,
  CircleIcon,
} from "lucide-react";
import * as Icons from "react-icons/ai";
import * as BiIcons from "react-icons/bi";
import * as BsIcons from "react-icons/bs";
import * as FaIcons from "react-icons/fa";
import * as FiIcons from "react-icons/fi";
import * as HiIcons from "react-icons/hi";
import * as IoIcons from "react-icons/io5";
import * as MdIcons from "react-icons/md";
import * as RiIcons from "react-icons/ri";
import * as TbIcons from "react-icons/tb";

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
  SelectSeparator,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn, snakeCaseToTitleCase } from "@/lib/utils";

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
import { useGetCustomColumns } from "@/features/custom-columns/api/use-get-custom-columns";

// Combine all icon sets for custom columns
const allIcons = {
  ...Icons,
  ...BiIcons,
  ...BsIcons,
  ...FaIcons,
  ...FiIcons,
  ...HiIcons,
  ...IoIcons,
  ...MdIcons,
  ...RiIcons,
  ...TbIcons,
};

interface WorkItemCardProps {
  workItem: PopulatedWorkItem;
  workspaceId: string;
  projectId?: string;
  onViewDetails?: () => void;
}

const typeConfig = {
  [WorkItemType.STORY]: { 
    icon: Bookmark, 
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-900/20",
  },
  [WorkItemType.BUG]: { 
    icon: Bug, 
    color: "text-red-600",
    bgColor: "bg-red-500",
    lightBg: "bg-red-50 dark:bg-red-900/20",
  },
  [WorkItemType.TASK]: { 
    icon: CheckSquare, 
    color: "text-green-600",
    bgColor: "bg-green-500",
    lightBg: "bg-green-50 dark:bg-green-900/20",
  },
  [WorkItemType.EPIC]: { 
    icon: Layers, 
    color: "text-purple-600",
    bgColor: "bg-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-900/20",
  },
  [WorkItemType.SUBTASK]: { 
    icon: ListTodo, 
    color: "text-slate-600",
    bgColor: "bg-slate-500",
    lightBg: "bg-slate-50 dark:bg-slate-800",
  },
};

const priorityConfig = {
  [WorkItemPriority.LOW]: { 
    label: "Low",
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-700",
    borderColor: "border-slate-200 dark:border-slate-600",
  },
  [WorkItemPriority.MEDIUM]: { 
    label: "Medium",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-700",
  },
  [WorkItemPriority.HIGH]: { 
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-700",
  },
  [WorkItemPriority.URGENT]: { 
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-700",
  },
};

const statusConfig = {
  [WorkItemStatus.TODO]: { 
    label: "To Do",
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-700",
    dotColor: "bg-slate-400",
  },
  [WorkItemStatus.ASSIGNED]: { 
    label: "Assigned",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    dotColor: "bg-blue-500",
  },
  [WorkItemStatus.IN_PROGRESS]: { 
    label: "In Progress",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    dotColor: "bg-amber-500",
  },
  [WorkItemStatus.IN_REVIEW]: { 
    label: "In Review",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
    dotColor: "bg-purple-500",
  },
  [WorkItemStatus.DONE]: { 
    label: "Done",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/30",
    dotColor: "bg-green-500",
  },
};

export const WorkItemCard = ({ workItem, workspaceId, projectId, onViewDetails }: WorkItemCardProps) => {
  const [showChildren, setShowChildren] = useState(false);
  const [editingStoryPoints, setEditingStoryPoints] = useState(false);
  const [assignAssigneeOpen, setAssignAssigneeOpen] = useState(false);
  const [assignEpicOpen, setAssignEpicOpen] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const { mutate: updateWorkItem } = useUpdateWorkItem();
  
  // Fetch custom columns for this project
  const { data: customColumnsData } = useGetCustomColumns({ 
    workspaceId, 
    projectId: projectId || workItem.projectId 
  });
  const customColumns = customColumnsData?.documents || [];

  // Helper function to get display name for a status
  const getStatusDisplayName = (status: string): string => {
    // Check if it's a default status
    if (Object.values(WorkItemStatus).includes(status as WorkItemStatus)) {
      return snakeCaseToTitleCase(status);
    }
    // Check if it's a custom column
    const customColumn = customColumns.find(col => col.$id === status);
    if (customColumn) {
      return customColumn.name;
    }
    return status;
  };

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

  const TypeIcon = typeConfig[workItem.type].icon;
  const typeStyles = typeConfig[workItem.type];
  const priorityStyles = priorityConfig[workItem.priority];
  const currentStatusConfig = statusConfig[workItem.status];

  return (
    <div className={cn(
      "group border rounded-lg bg-white dark:bg-slate-800/50 transition-all duration-150",
      "hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm",
      "border-slate-200 dark:border-slate-700"
    )}>
      <div className="flex items-stretch">
        {/* Type Indicator - Left edge */}
        <div className={cn("w-1 rounded-l-lg flex-shrink-0", typeStyles.bgColor)} />

        <div className="flex-1 p-3">
          {/* Main Row */}
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div className={cn("p-1.5 rounded-md flex-shrink-0", typeStyles.lightBg)}>
              <TypeIcon className={cn("size-3.5", typeStyles.color)} />
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
                <SelectValue>
                  {getStatusDisplayName(workItem.status)}
                </SelectValue>
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
                <SelectItem value={WorkItemStatus.ASSIGNED}>Assigned</SelectItem>
                {customColumns.length > 0 && (
                  <>
                    <SelectSeparator />
                    {customColumns.map((column) => {
                      const IconComponent = allIcons[column.icon as keyof typeof allIcons] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                      return (
                        <SelectItem key={column.$id} value={column.$id}>
                          <div className="flex items-center gap-2">
                            {IconComponent ? (
                              <IconComponent className="size-4" style={{ color: column.color }} />
                            ) : (
                              <CircleIcon className="size-4" style={{ color: column.color }} />
                            )}
                            {column.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </>
                )}
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

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {workItem.childrenCount! > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChildren(!showChildren)}
                      className="h-5 w-5 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                      {showChildren ? (
                        <ChevronDown className="size-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="size-3.5 text-slate-500" />
                      )}
                    </Button>
                  )}
                  <button
                    onClick={onViewDetails}
                    className="flex items-center gap-1.5 min-w-0 group/title"
                  >
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {workItem.key}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-200 truncate group-hover/title:text-blue-600 transition-colors">
                      {workItem.title}
                    </span>
                  </button>
                  {workItem.flagged && (
                    <Flag className="size-3.5 fill-red-500 text-red-500 flex-shrink-0" />
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
                <div className="flex items-center gap-1 mt-1.5">
                  <Badge 
                    variant="outline" 
                    className="h-5 px-1.5 text-[10px] font-normal text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20"
                  >
                    <Layers className="size-2.5 mr-1" />
                    {workItem.epic.key}
                  </Badge>
                </div>
              )}

              {/* Controls Row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Status Dropdown */}
                <Select
                  value={workItem.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger 
                    className={cn(
                      "h-6 w-auto min-w-[90px] text-[10px] font-medium px-2 border-0",
                      currentStatusConfig.bgColor,
                      currentStatusConfig.color
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={cn("size-1.5 rounded-full", currentStatusConfig.dotColor)} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status} className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn("size-1.5 rounded-full", config.dotColor)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority Badge */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "h-6 px-2 text-[10px] font-medium border",
                    priorityStyles.bgColor,
                    priorityStyles.color,
                    priorityStyles.borderColor
                  )}
                >
                  {priorityStyles.label}
                </Badge>

                {/* Story Points */}
                {editingStoryPoints ? (
                  <form onSubmit={handleStoryPointsSubmit} className="flex items-center">
                    <Input
                      name="storyPoints"
                      type="number"
                      defaultValue={workItem.storyPoints || 0}
                      className="h-6 w-12 text-[10px] text-center px-1"
                      autoFocus
                      onBlur={() => setEditingStoryPoints(false)}
                    />
                  </form>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-100"
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
                        className="flex items-center -space-x-1.5 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                        onMouseEnter={() => setAssigneePopoverOpen(true)}
                        onMouseLeave={() => setAssigneePopoverOpen(false)}
                        onClick={() => setAssignAssigneeOpen(true)}
                      >
                        {workItem.assignees.slice(0, 3).map((assignee) => (
                          <Avatar key={assignee.$id} className="size-5 border-2 border-white dark:border-slate-800 shadow-sm">
                            <AvatarImage src={assignee.profileImageUrl || undefined} />
                            <AvatarFallback className="text-[9px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              {assignee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {workItem.assignees.length > 3 && (
                          <div className="flex items-center justify-center size-5 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 text-[9px] font-medium text-slate-600 dark:text-slate-300 shadow-sm">
                            +{workItem.assignees.length - 3}
                          </div>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="center"
                      className="w-56 p-2"
                      onMouseEnter={() => setAssigneePopoverOpen(true)}
                      onMouseLeave={() => setAssigneePopoverOpen(false)}
                    >
                      <div className="space-y-1.5">
                        {workItem.assignees.map((assignee) => (
                          <div key={assignee.$id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
                            <Avatar className="size-6">
                              <AvatarImage src={assignee.profileImageUrl || undefined} />
                              <AvatarFallback className="text-[10px] font-medium bg-blue-100 text-blue-700">
                                {assignee.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                {assignee.name}
                              </span>
                              {assignee.email && (
                                <span className="text-[10px] text-muted-foreground truncate">
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
                    className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
                    onClick={() => setAssignAssigneeOpen(true)}
                  >
                    <Users className="size-3.5" />
                  </Button>
                )}

                {/* Children Count */}
                {workItem.childrenCount! > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {workItem.childrenCount} subtask{workItem.childrenCount! > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children (if expanded) */}
      {showChildren && workItem.children && workItem.children.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
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
