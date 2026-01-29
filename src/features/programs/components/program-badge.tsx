"use client";

import { FolderKanban } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ProgramStatus } from "../types";

interface ProgramBadgeProps {
  name: string;
  status?: ProgramStatus;
  color?: string;
  icon?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const statusColors: Record<ProgramStatus, string> = {
  [ProgramStatus.PLANNING]: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  [ProgramStatus.ACTIVE]: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  [ProgramStatus.ON_HOLD]: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  [ProgramStatus.COMPLETED]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  [ProgramStatus.CANCELLED]: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const sizeClasses = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-sm px-2 py-0.5",
  lg: "text-sm px-2.5 py-1",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export const ProgramBadge = ({
  name,
  status = ProgramStatus.ACTIVE,
  color,
  showIcon = true,
  showTooltip = true,
  size = "md",
  className,
}: ProgramBadgeProps) => {
  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors",
        sizeClasses[size],
        color ? undefined : statusColors[status],
        className
      )}
      style={color ? { backgroundColor: `${color}20`, borderColor: `${color}40`, color } : undefined}
    >
      {showIcon && <FolderKanban className={cn(iconSizes[size])} />}
      <span className="truncate max-w-[120px]">{name}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>Program: {name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            Status: {status.toLowerCase().replace("_", " ")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
