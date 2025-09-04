import React from "react";
import { X, Users, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { TaskStatus } from "../types";
import { StatusSelector } from "@/features/custom-columns/components/status-selector";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onStatusChange: (status: TaskStatus | string) => void;
  onAssigneeChange: (assigneeId: string) => void;
  isAdmin: boolean;
  assignees?: Array<{ $id: string; name: string }>;
  projectId?: string;
}

export const BulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onStatusChange,
  onAssigneeChange,
  isAdmin,
  assignees = [],
  projectId,
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
          <div className="w-[140px]">
            <StatusSelector
              onChange={onStatusChange}
              placeholder="Status"
              projectId={projectId}
            />
          </div>

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
