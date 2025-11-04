"use client";

import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkItemType, WorkItemStatus, WorkItemPriority } from "../types";

interface Epic {
  $id: string;
  key: string;
  title: string;
}

interface FiltersPanelProps {
  typeFilter: WorkItemType | "ALL";
  priorityFilter: WorkItemPriority | "ALL";
  statusFilter: WorkItemStatus | "ALL";
  selectedEpicId: string | null;
  epics: Epic[];
  onTypeChange: (value: WorkItemType | "ALL") => void;
  onPriorityChange: (value: WorkItemPriority | "ALL") => void;
  onStatusChange: (value: WorkItemStatus | "ALL") => void;
  onEpicChange: (value: string | null) => void;
  onClearAll: () => void;
}

export const FiltersPanel = ({
  typeFilter,
  priorityFilter,
  statusFilter,
  selectedEpicId,
  epics,
  onTypeChange,
  onPriorityChange,
  onStatusChange,
  onEpicChange,
  onClearAll,
}: FiltersPanelProps) => {
  const hasActiveFilters = 
    typeFilter !== "ALL" || 
    priorityFilter !== "ALL" || 
    statusFilter !== "ALL" || 
    selectedEpicId !== null;

    

  return (
    <div className="w-64 border rounded-md flex flex-col">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            Filters
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClearAll}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Type Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Type
            </label>
            <Select
              value={typeFilter}
              onValueChange={(value) => onTypeChange(value as WorkItemType | "ALL")}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="ALL">All Types</SelectItem>
                <SelectItem className="text-xs" value={WorkItemType.STORY}>Story</SelectItem>
                <SelectItem className="text-xs" value={WorkItemType.BUG}>Bug</SelectItem>
                <SelectItem className="text-xs" value={WorkItemType.TASK}>Task</SelectItem>
                <SelectItem className="text-xs" value={WorkItemType.EPIC}>Epic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Priority
            </label>
            <Select
              value={priorityFilter}
              onValueChange={(value) => onPriorityChange(value as WorkItemPriority | "ALL")}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="ALL">All Priorities</SelectItem>
                <SelectItem className="text-xs" value={WorkItemPriority.LOW}>Low</SelectItem>
                <SelectItem className="text-xs" value={WorkItemPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem className="text-xs" value={WorkItemPriority.HIGH}>High</SelectItem>
                <SelectItem className="text-xs" value={WorkItemPriority.URGENT}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusChange(value as WorkItemStatus | "ALL")}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="ALL">All Statuses</SelectItem>
                <SelectItem className="text-xs" value={WorkItemStatus.TODO}>To Do</SelectItem>
                <SelectItem className="text-xs" value={WorkItemStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem className="text-xs" value={WorkItemStatus.IN_REVIEW}>In Review</SelectItem>
                <SelectItem className="text-xs" value={WorkItemStatus.DONE}>Done</SelectItem>
                <SelectItem className="text-xs" value={WorkItemStatus.BLOCKED}>Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Epic Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Epic
            </label>
            <Select
              value={selectedEpicId || "ALL"}
              onValueChange={(value) => onEpicChange(value === "ALL" ? null : value)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="ALL">All Epics</SelectItem>
                <SelectItem className="text-xs" value="none">No Epic</SelectItem>
                {epics.map((epic) => (
                  <SelectItem key={epic.$id} className="text-xs" value={epic.$id}>
                    {epic.key}: {epic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 ml-auto text-xs"
                                onClick={onClearAll}
                              >
                                Clear all
                              </Button>
        </div>
      </ScrollArea>
    </div>
  );
};
