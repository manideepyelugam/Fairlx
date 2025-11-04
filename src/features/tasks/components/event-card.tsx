import { FlagIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Member } from "@/features/members/types";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Project } from "@/features/projects/types";

import { TaskStatus } from "../types";
import {
  AssigneeAvatarGroup,
  AssigneeLike,
} from "./assignee-avatar-group";
import { useTaskDetailsModal } from "../hooks/use-task-details-modal";

interface EventCardProps {
  title: string;
  assignee?: Member | AssigneeLike | { $id: string; name: string };
  assignees?: (Member | AssigneeLike | { $id: string; name: string; email?: string; profileImageUrl?: string | null })[];
  project?: Project | { $id: string; name: string };
  status: TaskStatus;
  id: string;
  isMilestone?: boolean;
}

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.ASSIGNED]: "border-l-red-400",
  [TaskStatus.IN_PROGRESS]: "border-l-yellow-400",
  [TaskStatus.COMPLETED]: "border-l-blue-400",
  [TaskStatus.CLOSED]: "border-l-emerald-400",
};

export const EventCard = ({
  title,
  assignee,
  assignees,
  project,
  status,
  id,
  isMilestone = false,
}: EventCardProps) => {
  const { open } = useTaskDetailsModal();

  const combinedAssignees: (
    | AssigneeLike
    | Member
    | { $id: string; name: string; email?: string; profileImageUrl?: string | null }
  )[] = assignees && assignees.length > 0
    ? assignees
    : assignee
    ? [assignee]
    : [];

  const normalizedAssignees: AssigneeLike[] = combinedAssignees.map((member) => ({
      $id: member.$id,
      name: "name" in member ? member.name : undefined,
      email: "email" in member ? member.email : undefined,
      profileImageUrl:
        "profileImageUrl" in member
          ? (member.profileImageUrl as string | null | undefined)
          : undefined,
    }));

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    open(id);
  };

  return (
    <div className="px-2">
      <div
        onClick={onClick}
        className={cn(
          "p-1.5 text-xs bg-white text-primary border rounded-md border-l-4 flex flex-col gap-y-1.5 cursor-pointer hover:opacity-75 transition",
          statusColorMap[status]
        )}
      >
        <div className="flex items-center justify-between">
          <p className="flex-1">{title}</p>
          {isMilestone && <FlagIcon className="size-3 text-primary ml-1" />}
        </div>
        <div className="flex items-center gap-x-1">
          {normalizedAssignees.length > 0 ? (
            <AssigneeAvatarGroup
              assignees={normalizedAssignees}
              visibleCount={3}
              avatarClassName="size-4 border border-white"
              fallbackClassName="text-[10px]"
              extraCountClassName="size-4 rounded-full bg-muted text-[10px] font-medium flex items-center justify-center border border-white"
              triggerClassName="flex items-center -space-x-1"
              popoverAlign="end"
              ariaLabel={`View ${normalizedAssignees.length} assignees`}
            />
          ) : (
            <span className="text-[10px] text-muted-foreground">Unassigned</span>
          )}
          <div className="size-1 rounded-full bg-neutral-300" />
          <ProjectAvatar
            name={project?.name || ""}
            image={project && "imageUrl" in project ? project.imageUrl : ""}
          />
        </div>
      </div>
    </div>
  );
};
