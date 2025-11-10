import { Layers, FileText, CheckSquare, Bug, ArrowRight } from "lucide-react";
import { WorkItemType } from "@/features/sprints/types";

interface WorkItemIconProps {
  type: WorkItemType;
  className?: string;
}

export function WorkItemIcon({ type, className = "h-4 w-4" }: WorkItemIconProps) {
  switch (type) {
    case WorkItemType.EPIC:
      return <Layers className={className} style={{ color: "#8B5CF6" }} />;
    case WorkItemType.STORY:
      return <FileText className={className} style={{ color: "#10B981" }} />;
    case WorkItemType.TASK:
      return <CheckSquare className={className} style={{ color: "#3B82F6" }} />;
    case WorkItemType.BUG:
      return <Bug className={className} style={{ color: "#EF4444" }} />;
    case WorkItemType.SUBTASK:
      return <ArrowRight className={className} style={{ color: "#6B7280" }} />;
    default:
      return <CheckSquare className={className} />;
  }
}
