"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskDateProps {
  value: string;
  className?: string;
}

export const TaskDate = ({ value, className }: TaskDateProps) => {
  if (!value) {
    return <span className={cn("text-muted-foreground", className)}>No date</span>;
  }

  try {
    const date = new Date(value);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return <span className={cn("text-muted-foreground", className)}>Invalid date</span>;
    }

    return (
      <span className={className}>
        {format(date, "MMM dd, yyyy")}
      </span>
    );
  } catch {
    return <span className={cn("text-muted-foreground", className)}>Invalid date</span>;
  }
};