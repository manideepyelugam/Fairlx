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
  frontend: "bg-blue-100 text-blue-700 border-blue-200",
  backend: "bg-green-100 text-green-700 border-green-200",
  design: "bg-pink-100 text-pink-700 border-pink-200",
  bug: "bg-red-100 text-red-700 border-red-200",
  documentation: "bg-yellow-100 text-yellow-700 border-yellow-200",
  research: "bg-purple-100 text-purple-700 border-purple-200",
};

// Default color if label not listed
const defaultColor = "bg-gray-100 text-gray-700 border-gray-200";

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
      className={cn("text-xs border", className, !color && defaultClasses)}
      style={color ? {
        backgroundColor: `${color}1A`, // 10% opacity
        color: color,
        borderColor: `${color}33` // 20% opacity
      } : undefined}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-muted rounded-full"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};
