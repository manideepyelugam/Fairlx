"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Circle, CheckCircle, Clock, Edit, Trash2, Play, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { StatusNodeData, StatusCategory, STATUS_CATEGORY_CONFIG } from "../types";

const getCategoryIcon = (category: StatusCategory) => {
  switch (category) {
    case StatusCategory.TODO:
      return Circle;
    case StatusCategory.IN_PROGRESS:
      return Clock;
    case StatusCategory.DONE:
      return CheckCircle;
    default:
      return Circle;
  }
};

type StatusNodeProps = {
  data: StatusNodeData;
  selected?: boolean;
};

export const StatusNode = memo(({ data, selected }: StatusNodeProps) => {
  const CategoryIcon = getCategoryIcon(data.category);
  const categoryConfig = STATUS_CATEGORY_CONFIG[data.category];

  return (
    <div
      className={cn(
        "relative min-w-[140px] max-w-[180px] rounded-lg border-2 bg-background shadow-md transition-all duration-200",
        selected ? "ring-2 ring-primary ring-offset-2" : "hover:shadow-lg",
        "group"
      )}
      style={{ borderColor: data.color }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-muted-foreground/50 !border-2 !border-background hover:!bg-primary transition-colors"
      />

      {/* Status Indicators */}
      <div className="absolute -top-1.5 left-2 flex gap-1">
        {data.isInitial && (
          <Badge variant="secondary" className="h-4 text-[8px] px-1.5 font-medium gap-0.5">
            <Play className="size-2 fill-current" />
            Start
          </Badge>
        )}
        {data.isFinal && (
          <Badge variant="secondary" className="h-4 text-[8px] px-1.5 font-medium gap-0.5 bg-emerald-100 text-emerald-700">
            <Flag className="size-2" />
            End
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="p-3 pt-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="flex-shrink-0 p-1 rounded-md"
              style={{ backgroundColor: `${data.color}20` }}
            >
              <CategoryIcon
                className="size-3.5"
                style={{ color: data.color }}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-xs truncate">{data.name}</h3>
              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wide">
                {data.key}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => data.onEdit(data.id)}>
                <Edit className="size-4 mr-2" />
                Edit Status
              </DropdownMenuItem>
              {data.onRemove && (
                <DropdownMenuItem onClick={() => data.onRemove?.(data.id)}>
                  <Circle className="size-4 mr-2" />
                  Remove from Canvas
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => data.onDelete(data.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category Badge */}
        <div className="mt-2 flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1.5"
            style={{ borderColor: `${data.color}50`, color: data.color }}
          >
            {categoryConfig.label}
          </Badge>
        </div>
      </div>

      {/* Color Bar */}
      <div
        className="h-0.5 rounded-b-lg"
        style={{ backgroundColor: data.color }}
      />
    </div>
  );
});

StatusNode.displayName = "StatusNode";
