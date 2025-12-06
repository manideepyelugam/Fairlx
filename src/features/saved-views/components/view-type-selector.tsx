"use client";

import { 
  LayoutList, 
  LayoutGrid, 
  Calendar,
  GanttChart,
  Layers,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavedViewType } from "../types";

interface ViewTypeSelectorProps {
  currentType: SavedViewType;
  onTypeChange: (type: SavedViewType) => void;
}

const VIEW_TYPE_CONFIG = [
  { type: SavedViewType.LIST, icon: LayoutList, label: "List" },
  { type: SavedViewType.KANBAN, icon: LayoutGrid, label: "Kanban" },
  { type: SavedViewType.CALENDAR, icon: Calendar, label: "Calendar" },
  { type: SavedViewType.TIMELINE, icon: GanttChart, label: "Timeline" },
  { type: SavedViewType.BACKLOG, icon: Layers, label: "Backlog" },
  { type: SavedViewType.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
];

export const ViewTypeSelector = ({
  currentType,
  onTypeChange,
}: ViewTypeSelectorProps) => {
  return (
    <div className="flex items-center border rounded-md p-1">
      {VIEW_TYPE_CONFIG.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={currentType === type ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2"
          onClick={() => onTypeChange(type)}
        >
          <Icon className="size-4 mr-1" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
};
