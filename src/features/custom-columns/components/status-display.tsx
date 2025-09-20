"use client";

import * as React from "react";
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

import { Badge } from "@/components/ui/badge";
import { snakeCaseToTitleCase } from "@/lib/utils";

import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
} from "lucide-react";

import { TaskStatus } from "@/features/tasks/types";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetCustomColumns } from "@/features/custom-columns/api/use-get-custom-columns";

// Combine all icon sets
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

const statusIconMap: Record<TaskStatus, React.ReactNode> = {
  [TaskStatus.BACKLOG]: (
    <CircleDashedIcon className="size-[18px] text-pink-400" />
  ),
  [TaskStatus.TODO]: <CircleIcon className="size-[18px] text-red-400" />,
  [TaskStatus.IN_PROGRESS]: (
    <CircleDotDashedIcon className="size-[18px] text-yellow-400" />
  ),
  [TaskStatus.IN_REVIEW]: (
    <CircleDotIcon className="size-[18px] text-blue-400" />
  ),
  [TaskStatus.DONE]: (
    <CircleCheckIcon className="size-[18px] text-emerald-400" />
  ),
};

interface StatusDisplayProps {
  status: string;
  projectId?: string;
}

export const StatusDisplay = ({ status, projectId }: StatusDisplayProps) => {
  const workspaceId = useWorkspaceId();
  const { data: customColumns = { documents: [] } } = useGetCustomColumns({
    workspaceId,
    projectId,
  });

  // Check if it's a default TaskStatus
  const isValidTaskStatus = Object.values(TaskStatus).includes(status as TaskStatus);
  
  if (isValidTaskStatus) {
    // Render default status with existing Badge variant
    return (
      <Badge variant={status as TaskStatus}>
        {snakeCaseToTitleCase(status)}
      </Badge>
    );
  }

  // Look for custom column
  const customColumn = customColumns.documents.find(col => col.$id === status);
  
  if (customColumn) {
    // Render custom column status
    const IconComponent = allIcons[customColumn.icon as keyof typeof allIcons];
    const icon = IconComponent ? (
      <IconComponent 
        className="size-3" 
        style={{ color: customColumn.color }}
      />
    ) : (
      <CircleIcon className="size-3" style={{ color: customColumn.color }} />
    );

    return (
      <div className="inline-flex items-center gap-x-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        {icon}
        {customColumn.name}
      </div>
    );
  }

  // Fallback for unknown status
  return (
    <Badge variant="secondary">
      {status}
    </Badge>
  );
};
