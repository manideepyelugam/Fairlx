import { PencilIcon } from "lucide-react";

import { DottedSeparator } from "@/components/dotted-separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { snakeCaseToTitleCase } from "@/lib/utils";

import { MemberAvatar } from "@/features/members/components/member-avatar";

import { OverviewProperty } from "./overview-property";
import { TaskDate } from "./task-date";

import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { TaskStatus, PopulatedTask } from "../types";

interface TaskOverviewProps {
  task: PopulatedTask;
}

export const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Overview</p>
          <Button onClick={() => open(task.$id)} size="sm" variant="secondary">
            <PencilIcon className="size-4 mr-2" />
            Edit
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <div className="flex flex-col gap-y-4">
          <OverviewProperty label={task.assignees && task.assignees.length > 1 ? "Assignees" : "Assignee"}>
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex items-center gap-x-2">
                <div className="flex -space-x-2">
                  {task.assignees.slice(0, 3).map((assignee: { $id: string; name: string }) => (
                    <MemberAvatar
                      key={assignee.$id}
                      name={assignee.name}
                      className="size-6 border-2 border-white"
                    />
                  ))}
                  {task.assignees.length > 3 && (
                    <div className="size-6 bg-muted border-2 border-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">+{task.assignees.length - 3}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">
                    {task.assignees.length === 1 
                      ? task.assignees[0].name 
                      : `${task.assignees.length} assignees`
                    }
                  </p>
                  {task.assignees.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {task.assignees.slice(0, 2).map((a: { name: string }) => a.name).join(", ")}
                      {task.assignees.length > 2 && "..."}
                    </p>
                  )}
                </div>
              </div>
            ) : task.assignee ? (
              <>
                <MemberAvatar name={task.assignee.name} className="size-6" />
                <p className="text-sm font-medium">{task.assignee.name}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No assignee</p>
            )}
          </OverviewProperty>
          <OverviewProperty label="Due Date">
            <TaskDate value={task.dueDate} className="text-sm font-medium" />
          </OverviewProperty>
          <OverviewProperty label="Status">
            <Badge variant={Object.values(TaskStatus).includes(task.status as TaskStatus) ? task.status as TaskStatus : "secondary"}>
              {snakeCaseToTitleCase(task.status)}
            </Badge>
          </OverviewProperty>
          {task.estimatedHours && (
            <OverviewProperty label="Estimated Hours">
              <p className="text-sm font-medium">{task.estimatedHours}h</p>
            </OverviewProperty>
          )}
        </div>
      </div>
    </div>
  );
};
