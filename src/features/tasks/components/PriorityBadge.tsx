import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-muted text-muted-foreground border-border",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  HIGH: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  URGENT: "bg-destructive/10 text-destructive border-destructive/20",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-[10px] font-semibold rounded-xl",
        priorityStyles[priority],
        className
      )}
    >
      {priorityLabels[priority]}
    </Badge>
  );
};
