import { MoreHorizontalIcon } from "lucide-react";

import { DottedSeparator } from "@/components/dotted-separator";
import { Checkbox } from "@/components/ui/checkbox";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { TaskActions } from "./task-actions";
import { TaskDate } from "./task-date";
import { PriorityBadge } from "./priority-selector";
import { LabelsDisplay } from "./label-management";

import { Task, PopulatedTask } from "../types";

interface KanbanCardProps {
  task: PopulatedTask;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  showSelection?: boolean;
}

export const KanbanCard = ({ 
  task, 
  isSelected = false,
  onSelect,
  showSelection = false 
}: KanbanCardProps) => {
  return (
    <div className={`bg-white p-2.5 mb-1.5 rounded shadow-sm space-y-3 ${
      isSelected ? 'ring-2 ring-blue-500' : ''
    } ${showSelection ? 'hover:bg-gray-50' : ''}`}>
      <div className="flex items-start justify-between gap-x-2">
        {showSelection && (
          <div className="flex items-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect?.(task.$id, !!checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <p className="text-sm line-clamp-2 flex-1">{task.name}</p>
        <div className="flex items-center gap-1">
          {task.priority && <PriorityBadge priority={task.priority} />}
          <TaskActions id={task.$id} projectId={task.projectId}>
            <MoreHorizontalIcon className="size-[18px] stroke-1 shrink-0 text-neutral-700 hover:opacity-75 transition" />
          </TaskActions>
        </div>
      </div>
      
      {task.labels && task.labels.length > 0 && (
        <LabelsDisplay labels={task.labels} maxDisplay={2} />
      )}
      
      <DottedSeparator />
      <div className="flex items-center gap-x-1.5">
        {task.assignee && (
          <MemberAvatar
            name={task.assignee.name}
            fallbackClassName="text-[10px]"
          />
        )}
        <div className="size-1 rounded-full bg-neutral-300" />
        <TaskDate value={task.dueDate} className="text-xs" />
      </div>
      {task.project && (
        <div className="flex items-center gap-x-1.5">
          <ProjectAvatar
            name={task.project.name}
            image={task.project.imageUrl}
            fallbackClassName="text-[10px]"
          />
          <span className="text-xs font-medium">{task.project.name}</span>
        </div>
      )}
    </div>
  );
};
