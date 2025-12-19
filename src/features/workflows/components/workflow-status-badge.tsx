"use client";

import { cn } from "@/lib/utils";
import { StatusType } from "../types";

interface WorkflowStatusBadgeProps {
  name: string;
  color: string;
  statusType: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const WorkflowStatusBadge = ({
  name,
  color,
  size = "md",
  className,
}: WorkflowStatusBadgeProps) => {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: color,
        borderWidth: 1,
      }}
    >
      <span
        className={cn(
          "rounded-full",
          size === "sm" ? "size-1.5" : size === "md" ? "size-2" : "size-2.5"
        )}
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
};
