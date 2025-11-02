import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BacklogItemPriority } from "../types";

interface BacklogPriorityBadgeProps {
  priority: BacklogItemPriority;
  className?: string;
}

const priorityStyles: Record<BacklogItemPriority, string> = {
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
};

const priorityLabels: Record<BacklogItemPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const BacklogPriorityBadge = ({ priority, className }: BacklogPriorityBadgeProps) => {
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
