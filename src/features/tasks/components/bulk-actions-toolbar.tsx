import React from "react";
import { X, Users, Tags, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { TaskStatus } from "../types";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onAssigneeChange: (assigneeId: string) => void;
  isAdmin: boolean;
  assignees?: Array<{ $id: string; name: string }>;
}

export const BulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onStatusChange,
  onAssigneeChange,
  isAdmin,
  assignees = [],
}: BulkActionsToolbarProps) => {
  if (!isAdmin || selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4 min-w-[400px]">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {selectedCount} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
              <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
              <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={onAssigneeChange}>
            <SelectTrigger className="w-[140px] h-8">
              <Users className="size-4 mr-2" />
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              {assignees.map((assignee) => (
                <SelectItem key={assignee.$id} value={assignee.$id}>
                  {assignee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="ml-auto"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
};
