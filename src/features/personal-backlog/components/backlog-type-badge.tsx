import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BacklogItemType } from "../types";

interface BacklogTypeBadgeProps {
  type: BacklogItemType;
  className?: string;
  showIcon?: boolean;
}

const typeStyles: Record<BacklogItemType, { color: string; icon: string }> = {
  TASK: { color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: "📋" }, // Task
  STORY: { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: "📖" }, // Story
  BUG: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: "🐛" }, // Bug
  EPIC: { color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: "🚀" }, // Epic
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
