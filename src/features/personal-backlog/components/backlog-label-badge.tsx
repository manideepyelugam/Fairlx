import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BacklogLabelBadgeProps {
  label: string;
  className?: string;
}

// Assign consistent colors to common labels
const labelColors: Record<string, string> = {
  frontend: "bg-blue-100 text-blue-700 border-blue-200",
  backend: "bg-green-100 text-green-700 border-green-200",
  design: "bg-pink-100 text-pink-700 border-pink-200",
  bug: "bg-red-100 text-red-700 border-red-200",
  documentation: "bg-yellow-100 text-yellow-700 border-yellow-200",
  research: "bg-purple-100 text-purple-700 border-purple-200",
  feature: "bg-indigo-100 text-indigo-700 border-indigo-200",
  improvement: "bg-teal-100 text-teal-700 border-teal-200",
  refactor: "bg-cyan-100 text-cyan-700 border-cyan-200",
  testing: "bg-violet-100 text-violet-700 border-violet-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
  blocked: "bg-orange-100 text-orange-700 border-orange-200",
};

// Default color if label not listed
const defaultColor = "bg-gray-100 text-gray-700 border-gray-200";

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
