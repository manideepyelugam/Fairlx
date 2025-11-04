import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BacklogItemType } from "../types";

interface BacklogTypeBadgeProps {
  type: BacklogItemType;
  className?: string;
  showIcon?: boolean;
}

const typeStyles: Record<BacklogItemType, { color: string; icon: string }> = {
  TASK: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: "📋" },
  BUG: { color: "bg-red-100 text-red-700 border-red-200", icon: "🐛" },
  IDEA: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: "💡" },
  IMPROVEMENT: { color: "bg-green-100 text-green-700 border-green-200", icon: "🚀" },
};

const typeLabels: Record<BacklogItemType, string> = {
  TASK: "Task",
  BUG: "Bug",
  IDEA: "Idea",
  IMPROVEMENT: "Improvement",
};

export const BacklogTypeBadge = ({ type, className, showIcon = true }: BacklogTypeBadgeProps) => {
  const { color, icon } = typeStyles[type];

  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-[10px] font-semibold rounded-xl",
        color,
        className
      )}
    >
      {showIcon && <span className="mr-1">{icon}</span>}
      {typeLabels[type]}
    </Badge>
  );
};
