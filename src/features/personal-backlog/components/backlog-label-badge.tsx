import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BacklogLabelBadgeProps {
  label: string;
  className?: string;
}

// Assign consistent colors to common labels
const labelColors: Record<string, string> = {
  frontend: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  backend: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  design: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  bug: "bg-destructive/10 text-destructive border-destructive/20",
  documentation: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  research: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  feature: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  improvement: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  refactor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  testing: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  blocked: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
};

const defaultColor = "bg-muted text-muted-foreground border-border";

export const BacklogLabelBadge = ({ label, className }: BacklogLabelBadgeProps) => {
  const color = labelColors[label.toLowerCase()] || defaultColor;

  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-[10px] font-semibold rounded-xl",
        color,
        className
      )}
    >
      {label}
    </Badge>
  );
};
