import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BacklogItemType } from "../types";

interface BacklogTypeBadgeProps {
  type: BacklogItemType;
  className?: string;
  showIcon?: boolean;
}

const typeStyles: Record<BacklogItemType, { color: string; icon: string }> = {
  STORY: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "📄" }, // Story
  BUG: { color: "bg-red-100 text-red-700 border-red-200", icon: "🐛" }, // Bug
  TASK: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: "📋" }, // Task
  EPIC: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: "👑" }, // Epic
  SUBTASK: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: "➡️" }, // Subtask
  IDEA: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "💡" }, // Idea
  IMPROVEMENT: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: "🚀" }, // Improvement
};

const typeLabels: Record<BacklogItemType, string> = {
  STORY: "Story",
  BUG: "Bug",
  TASK: "Task",
  EPIC: "Epic",
  SUBTASK: "Subtask",
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
