import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  TimelineItem,
  TimelineGridConfig,
  TimelineZoomLevel,
  ZOOM_CONFIGS,
  STATUS_COLORS,
  DragState,
} from "../types";
import {
  calculateBarPosition,
  dateToPixel,
  formatDateForZoom,
} from "../utils";
import {
  addDays,
  addWeeks,
  addMonths,
  format,
  differenceInDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimelineGridProps {
  items: TimelineItem[];
  gridConfig: TimelineGridConfig;
  zoomLevel: TimelineZoomLevel;
  selectedItemId: string | null;
  onItemClick: (itemId: string) => void;
  onItemUpdate: (itemId: string, updates: { startDate?: string; dueDate?: string }) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function TimelineGrid({
  items,
  gridConfig,
  zoomLevel,
  selectedItemId,
  onItemClick,
  onItemUpdate,
  scrollContainerRef,
}: TimelineGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    itemId: null,
    type: null,
    startX: 0,
    currentX: 0,
  });

  // Calculate total width and height
  const totalDays = differenceInDays(gridConfig.maxDate, gridConfig.minDate) + 1;
  const totalWidth = totalDays * gridConfig.dayWidth;
  const totalHeight = items.length * gridConfig.rowHeight;

  // Center on today when component mounts
  useEffect(() => {
    if (scrollContainerRef?.current) {
      const todayX = dateToPixel(new Date(), gridConfig);
      scrollContainerRef.current.scrollLeft = todayX - scrollContainerRef.current.clientWidth / 2;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle mouse down on bar (start drag)
  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent, item: TimelineItem, type: "move" | "resize-start" | "resize-end") => {
      e.preventDefault();
      e.stopPropagation();

      setDragState({
        isDragging: true,
        itemId: item.id,
        type,
        startX: e.clientX,
        currentX: e.clientX,
        originalStartDate: item.startDate,
        originalEndDate: item.dueDate,
      });
    },
    []
  );

  // Handle mouse move (during drag)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.itemId) return;

      setDragState((prev) => ({
        ...prev,
        currentX: e.clientX,
      }));
    },
    [dragState.isDragging, dragState.itemId]
  );

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging || !dragState.itemId) return;

    const item = items.find((i) => i.id === dragState.itemId);
    if (!item || !item.startDate || !item.dueDate) {
      setDragState({
        isDragging: false,
        itemId: null,
        type: null,
        startX: 0,
        currentX: 0,
      });
      return;
    }

    const deltaX = dragState.currentX - dragState.startX;
    const deltaDays = Math.round(deltaX / gridConfig.dayWidth);

    if (Math.abs(deltaDays) === 0) {
      setDragState({
        isDragging: false,
        itemId: null,
        type: null,
        startX: 0,
        currentX: 0,
      });
      return;
    }

    let updates: { startDate?: string; dueDate?: string } = {};

    if (dragState.type === "move") {
      // Move both start and end dates
      const newStartDate = addDays(new Date(item.startDate), deltaDays);
      const newEndDate = addDays(new Date(item.dueDate), deltaDays);
      updates = {
        startDate: format(newStartDate, "yyyy-MM-dd"),
        dueDate: format(newEndDate, "yyyy-MM-dd"),
      };
    } else if (dragState.type === "resize-start") {
      // Only move start date
      const newStartDate = addDays(new Date(item.startDate), deltaDays);
      updates = {
        startDate: format(newStartDate, "yyyy-MM-dd"),
      };
    } else if (dragState.type === "resize-end") {
      // Only move end date
      const newEndDate = addDays(new Date(item.dueDate), deltaDays);
      updates = {
        dueDate: format(newEndDate, "yyyy-MM-dd"),
      };
    }

    onItemUpdate(item.id, updates);

    setDragState({
      isDragging: false,
      itemId: null,
      type: null,
      startX: 0,
      currentX: 0,
    });
  }, [dragState, items, gridConfig, onItemUpdate]);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={gridRef}
      className="relative bg-white"
      style={{
        width: totalWidth,
        height: totalHeight + gridConfig.headerHeight,
        minWidth: "100%",
      }}
    >
      {/* Time Scale Header */}
      <TimeScaleHeader
        gridConfig={gridConfig}
        zoomLevel={zoomLevel}
      />

      {/* Grid Lines */}
      <GridLines
        gridConfig={gridConfig}
        zoomLevel={zoomLevel}
      />

      {/* Today Marker */}
      <TodayMarker gridConfig={gridConfig} items={items} />

      {/* Task Bars */}
      <TooltipProvider>
        {items.map((item, index) => {
          const position = calculateBarPosition(item, gridConfig, index);
          if (!position) return null;

          // Apply drag offset if this item is being dragged
          let adjustedX = position.x;
          let adjustedWidth = position.width;

          if (dragState.isDragging && dragState.itemId === item.id) {
            const deltaX = dragState.currentX - dragState.startX;
            if (dragState.type === "move") {
              adjustedX += deltaX;
            } else if (dragState.type === "resize-start") {
              adjustedX += deltaX;
              adjustedWidth -= deltaX;
            } else if (dragState.type === "resize-end") {
              adjustedWidth += deltaX;
            }
          }

          return (
            <TaskBar
              key={item.id}
              item={item}
              x={adjustedX}
              width={Math.max(adjustedWidth, 40)}
              y={position.y + gridConfig.headerHeight}
              height={gridConfig.rowHeight - 8}
              isSelected={selectedItemId === item.id}
              onClick={() => onItemClick(item.id)}
              onMouseDown={handleBarMouseDown}
            />
          );
        })}
      </TooltipProvider>
    </div>
  );
}

interface TimeScaleHeaderProps {
  gridConfig: TimelineGridConfig;
  zoomLevel: TimelineZoomLevel;
}

function TimeScaleHeader({ gridConfig, zoomLevel }: TimeScaleHeaderProps) {
  const headers: Array<{ label: string; x: number; width: number }> = [];
  let currentDate = gridConfig.minDate;

  const config = ZOOM_CONFIGS[zoomLevel];

  while (currentDate <= gridConfig.maxDate) {
    const label = formatDateForZoom(currentDate, zoomLevel);
    const x = dateToPixel(currentDate, gridConfig);

    let nextDate: Date;
    if (config.unit === "day") {
      nextDate = addDays(currentDate, 1);
    } else if (config.unit === "week") {
      nextDate = addWeeks(currentDate, 1);
    } else {
      nextDate = addMonths(currentDate, 1);
    }

    const width = dateToPixel(nextDate, gridConfig) - x;
    headers.push({ label, x, width });

    currentDate = nextDate;
  }

  return (
    <div
      className="sticky top-0 bg-white border-b z-10 flex"
      style={{ height: gridConfig.headerHeight }}
    >
      {headers.map((header, index) => (
        <div
          key={index}
          className="border-r text-xs text-center py-2 font-medium flex items-center justify-center"
          style={{
            position: "absolute",
            left: header.x,
            width: header.width,
          }}
        >
          {header.label}
        </div>
      ))}
    </div>
  );
}

interface GridLinesProps {
  gridConfig: TimelineGridConfig;
  zoomLevel: TimelineZoomLevel;
}

function GridLines({ gridConfig, zoomLevel }: GridLinesProps) {
  const lines: number[] = [];
  const config = ZOOM_CONFIGS[zoomLevel];

  // Vertical lines
  let currentDate = gridConfig.minDate;
  while (currentDate <= gridConfig.maxDate) {
    const x = dateToPixel(currentDate, gridConfig);
    lines.push(x);

    if (config.unit === "day") {
      currentDate = addDays(currentDate, 1);
    } else if (config.unit === "week") {
      currentDate = addWeeks(currentDate, 1);
    } else {
      currentDate = addMonths(currentDate, 1);
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ top: gridConfig.headerHeight }}>
      {/* Vertical lines */}
      {lines.map((x, index) => (
        <div
          key={`v-${index}`}
          className="absolute top-0 bottom-0 border-l border-border/30"
          style={{ left: x }}
        />
      ))}
    </div>
  );
}

interface TodayMarkerProps {
  gridConfig: TimelineGridConfig;
  items: TimelineItem[];
}

function TodayMarker({ gridConfig, items }: TodayMarkerProps) {
  const todayX = dateToPixel(new Date(), gridConfig);
  const totalHeight = items.length * gridConfig.rowHeight;

  return (
    <div
      className="absolute top-0 w-0.5 bg-blue-600 z-20 pointer-events-none"
      style={{
        left: todayX,
        height: totalHeight + gridConfig.headerHeight,
      }}
    >
      <div className="absolute top-0 -left-6 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
        Today
      </div>
    </div>
  );
}

interface TaskBarProps {
  item: TimelineItem;
  x: number;
  width: number;
  y: number;
  height: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseDown: (e: React.MouseEvent, item: TimelineItem, type: "move" | "resize-start" | "resize-end") => void;
}

function TaskBar({
  item,
  x,
  width,
  y,
  height,
  isSelected,
  onClick,
  onMouseDown,
}: TaskBarProps) {
  // Provide a fallback status color in case status is undefined or invalid
  const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.TODO;
  const isInProgress = item.status === "IN_PROGRESS";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "absolute rounded-sm cursor-pointer transition-all group shadow-sm",
            statusStyle.bg,
            "border-l-4",
            statusStyle.border,
            isSelected && "ring-2 ring-blue-500 ring-offset-1",
            "hover:shadow-md hover:brightness-95"
          )}
          style={{
            left: x,
            top: y,
            width,
            height,
          }}
          onClick={onClick}
          onMouseDown={(e) => onMouseDown(e, item, "move")}
        >
          {/* Progress fill for in-progress items */}
          {isInProgress && (
            <div
              className="absolute inset-0 bg-violet-400/30 rounded-l-sm transition-all"
              style={{ width: `${item.progress}%` }}
            />
          )}

          {/* Content - Jira style with key displayed */}
          <div className="absolute inset-0 flex items-center px-2 text-xs font-medium truncate">
            <span className="truncate font-mono">{item.key}</span>
          </div>

          {/* Resize handles - subtle like Jira */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-gray-900/20 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e, item, "resize-start");
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-gray-900/20 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e, item, "resize-end");
            }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <div className="font-semibold">{item.key}: {item.title}</div>
          <div className="text-xs text-muted-foreground">
            {item.startDate && format(new Date(item.startDate), "MMM d")} - {item.dueDate && format(new Date(item.dueDate), "MMM d, yyyy")}
          </div>
          {item.assignees && item.assignees.length > 0 && (
            <div className="text-xs">
              Assigned to: {item.assignees.map((a) => a.name).join(", ")}
            </div>
          )}
          <div className="text-xs">Progress: {item.progress}%</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
