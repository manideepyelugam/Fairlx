import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface LabelBadgeProps {
  label: string;
  className?: string;
  onRemove?: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

// Assign consistent colors to common labels
const labelColors: Record<string, string> = {
  frontend: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  backend: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  design: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  bug: "bg-destructive/10 text-destructive border-destructive/20",
  documentation: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  research: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

const defaultColor = "bg-muted text-muted-foreground border-border";

export const LabelBadge = ({
  label,
  onRemove,
  variant = "secondary",
  className,
  color, // Custom hex color
}: LabelBadgeProps & { color?: string }) => {
  const defaultClasses = labelColors[label.toLowerCase()] || defaultColor;

  return (
    <Badge
      variant={variant}
      className={cn("text-xs rounded-full border max-w-full", className, !color && defaultClasses)}
      style={color ? {
        backgroundColor: `${color}1A`, // 10% opacity
        color: color,
        borderColor: `${color}33` // 20% opacity
      } : undefined}
    >
      <p className="text-[11px] truncate">{label}</p>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 rounded-full flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};
