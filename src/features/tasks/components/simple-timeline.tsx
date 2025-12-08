"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, parseISO, startOfDay, isSameDay, isWeekend } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, FlagIcon, Link2Icon, ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TaskStatus, PopulatedTask } from "../types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { cn } from "@/lib/utils";

// Work Item Link types (matching work-item-links feature)
type LinkType = "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES" | "IS_DUPLICATED_BY" | 
  "PARENT_OF" | "CHILD_OF" | "CAUSES" | "IS_CAUSED_BY" | "CLONES" | "IS_CLONED_BY" | "SPLIT_TO" | "SPLIT_FROM";

interface WorkItemLink {
  $id: string;
  sourceWorkItemId: string;
  targetWorkItemId: string;
  linkType: LinkType;
}

interface SimpleTimelineProps {
  data: PopulatedTask[];
  links?: WorkItemLink[];
  showDependencies?: boolean;
}

type ViewType = "week" | "month" | "quarter";

const statusConfig: Record<string, { color: string }> = {
  [TaskStatus.TODO]: { color: "bg-gray-500" },
  [TaskStatus.ASSIGNED]: { color: "bg-red-500" },
  [TaskStatus.IN_PROGRESS]: { color: "bg-yellow-500" },
  [TaskStatus.IN_REVIEW]: { color: "bg-blue-500" },
  [TaskStatus.DONE]: { color: "bg-emerald-500" },
};

// Dependency arrow colors based on link type
const linkTypeConfig: Record<string, { color: string; label: string }> = {
  BLOCKS: { color: "#ef4444", label: "Blocks" },
  IS_BLOCKED_BY: { color: "#ef4444", label: "Blocked by" },
  PARENT_OF: { color: "#3b82f6", label: "Parent" },
  CHILD_OF: { color: "#3b82f6", label: "Child" },
  RELATES_TO: { color: "#6b7280", label: "Related" },
  DUPLICATES: { color: "#f59e0b", label: "Duplicates" },
  IS_DUPLICATED_BY: { color: "#f59e0b", label: "Duplicated by" },
  CAUSES: { color: "#8b5cf6", label: "Causes" },
  IS_CAUSED_BY: { color: "#8b5cf6", label: "Caused by" },
};

export const SimpleTimeline = ({ data, links = [], showDependencies = true }: SimpleTimelineProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");
  const [showArrows, setShowArrows] = useState(showDependencies);
  const containerRef = useRef<HTMLDivElement>(null);
  const [taskRefs] = useState<Map<string, HTMLDivElement>>(new Map());
  const [arrowPaths, setArrowPaths] = useState<Array<{
    id: string;
    path: string;
    color: string;
    linkType: LinkType;
    sourceId: string;
    targetId: string;
  }>>([]);

  // Calculate date range based on view type
  const { startDate, endDate } = useMemo(() => {
    const start = startOfWeek(currentDate);
    let end: Date;

    switch (viewType) {
      case "week":
        end = endOfWeek(currentDate);
        break;
      case "month":
        end = addDays(start, 30);
        break;
      case "quarter":
        end = addDays(start, 90);
        break;
      default:
        end = endOfWeek(currentDate);
    }

    return { startDate: start, endDate: end };
  }, [currentDate, viewType]);

  const timelineDays = useMemo(() => {
    if (viewType === "quarter") {
      // For quarter view, show weeks
      const weeks = [];
      let current = startDate;
      while (current <= endDate) {
        weeks.push({
          date: current,
          label: format(current, "MMM dd"),
          isWeekStart: true,
          isWeekend: false,
          isToday: isSameDay(current, new Date())
        });
        current = addDays(current, 7);
      }
      return weeks;
    } else {
      // For week and month view, show days
      return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
        date,
        label: format(date, viewType === "week" ? "EEE\ndd" : "dd"),
        isWeekStart: date.getDay() === 0,
        isWeekend: isWeekend(date),
        isToday: isSameDay(date, new Date())
      }));
    }
  }, [startDate, endDate, viewType]);

  const processedTasks = useMemo(() => {
    return data.map(task => {
      const taskStart = startOfDay(parseISO(task.dueDate || new Date().toISOString()));
      const taskEnd = task.endDate ? startOfDay(parseISO(task.endDate)) : taskStart;
      
      // Calculate position and width
      const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
      const endOffset = Math.min(timelineDays.length - 1, differenceInDays(taskEnd, startDate));
      const duration = Math.max(1, endOffset - startOffset + 1);
      
      // Only show tasks that intersect with current view
      const isVisible = taskStart <= endDate && taskEnd >= startDate;

      return {
        ...task,
        startOffset,
        duration,
        isVisible,
        taskStart,
        taskEnd,
        isMilestone: taskStart.getTime() === taskEnd.getTime()
      };
    }).filter(task => task.isVisible);
  }, [data, startDate, endDate, timelineDays.length]);

  // Filter links to only show visible ones (both tasks are visible)
  const visibleLinks = useMemo(() => {
    const visibleTaskIds = new Set(processedTasks.map(t => t.$id));
    return links.filter(link => 
      visibleTaskIds.has(link.sourceWorkItemId) && 
      visibleTaskIds.has(link.targetWorkItemId)
    );
  }, [links, processedTasks]);

  // Update arrow paths when tasks are rendered
  useEffect(() => {
    if (!showArrows || visibleLinks.length === 0) {
      setArrowPaths([]);
      return;
    }

    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      const newPaths: typeof arrowPaths = [];
      
      visibleLinks.forEach(link => {
        const sourceEl = taskRefs.get(link.sourceWorkItemId);
        const targetEl = taskRefs.get(link.targetWorkItemId);
        const container = containerRef.current;
        
        if (!sourceEl || !targetEl || !container) return;
        
        const containerRect = container.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        
        // Calculate relative positions
        const sourceX = sourceRect.right - containerRect.left;
        const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
        const targetX = targetRect.left - containerRect.left;
        const targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
        
        // Create curved path
        const controlOffset = Math.abs(targetY - sourceY) / 2 + 20;
        
        let path: string;
        if (sourceY === targetY) {
          // Straight line for same row
          path = `M ${sourceX} ${sourceY} L ${targetX - 6} ${targetY}`;
        } else {
          // Curved line for different rows
          path = `M ${sourceX} ${sourceY} 
                  C ${sourceX + controlOffset} ${sourceY}, 
                    ${targetX - controlOffset} ${targetY}, 
                    ${targetX - 6} ${targetY}`;
        }
        
        newPaths.push({
          id: link.$id,
          path,
          color: linkTypeConfig[link.linkType]?.color || "#6b7280",
          linkType: link.linkType,
          sourceId: link.sourceWorkItemId,
          targetId: link.targetWorkItemId,
        });
      });
      
      setArrowPaths(newPaths);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [showArrows, visibleLinks, processedTasks, taskRefs, viewType]);

  const navigate = (direction: "prev" | "next") => {
    const amount = viewType === "week" ? 7 : viewType === "month" ? 30 : 90;
    const newDate = direction === "prev" 
      ? addDays(currentDate, -amount)
      : addDays(currentDate, amount);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const dayWidth = viewType === "quarter" ? 28 : viewType === "month" ? 40 : 80;

  // Register task bar ref
  const setTaskRef = (taskId: string, el: HTMLDivElement | null) => {
    if (el) {
      taskRefs.set(taskId, el);
    } else {
      taskRefs.delete(taskId);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Timeline & Gantt Chart
          </CardTitle>
          
          <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-2">
            {/* Dependencies Toggle */}
            {links.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showArrows ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setShowArrows(!showArrows)}
                      className="gap-2"
                    >
                      <Link2Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">Dependencies</span>
                      <Badge variant="outline" className="ml-1 text-xs">
                        {links.length}
                      </Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showArrows ? "Hide" : "Show"} dependency arrows
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* View Type Selector */}
            <div className="flex border rounded-lg p-1 bg-muted">
              {(["week", "month", "quarter"] as ViewType[]).map((view) => (
                <Button
                  key={view}
                  variant={viewType === view ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewType(view)}
                  className="capitalize"
                >
                  {view}
                </Button>
              ))}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("prev")}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="px-4 font-medium"
              >
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("next")}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
          </div>
          
          {/* Dependency Legend */}
          {showArrows && visibleLinks.length > 0 && (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">Links:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-500 rounded" />
                <span>Blocks</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500 rounded" />
                <span>Parent/Child</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-gray-500 rounded" />
                <span>Related</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t" ref={containerRef}>
          {/* Timeline Header */}
          <div className="flex bg-muted/30 sticky top-0 z-10">
            <div className="w-80 p-4 border-r bg-background">
              <div className="font-medium text-sm">Tasks</div>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex min-w-max">
                {timelineDays.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className={cn(
                      "flex-shrink-0 p-2 text-center border-r border-border/50 relative",
                      day.isWeekend && "bg-muted/20",
                      day.isToday && "bg-primary/5 border-primary/30",
                      day.isWeekStart && "border-l-2 border-primary/20"
                    )}
                    style={{ width: `${dayWidth}px` }}
                  >
                    <div className={cn(
                      "text-xs font-medium whitespace-pre-line",
                      day.isToday && "text-primary font-bold"
                    )}>
                      {day.label}
                    </div>
                    {viewType !== "quarter" && (
                      <div className={cn(
                        "text-xs text-muted-foreground mt-1",
                        day.isToday && "text-primary/80"
                      )}>
                        {format(day.date, "EEE")}
                      </div>
                    )}
                    {day.isToday && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Timeline Content with SVG Overlay for Arrows */}
          <div className="relative">
            {/* SVG Layer for Dependency Arrows */}
            {showArrows && arrowPaths.length > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none z-20"
                style={{ width: "100%", height: "100%" }}
              >
                <defs>
                  {/* Arrow markers for each color */}
                  <marker
                    id="arrowhead-red"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                  </marker>
                  <marker
                    id="arrowhead-blue"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                  <marker
                    id="arrowhead-gray"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                  </marker>
                  <marker
                    id="arrowhead-amber"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                  </marker>
                  <marker
                    id="arrowhead-purple"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                  </marker>
                </defs>
                
                {arrowPaths.map((arrow) => {
                  // Determine marker based on color
                  let markerId = "arrowhead-gray";
                  if (arrow.color === "#ef4444") markerId = "arrowhead-red";
                  else if (arrow.color === "#3b82f6") markerId = "arrowhead-blue";
                  else if (arrow.color === "#f59e0b") markerId = "arrowhead-amber";
                  else if (arrow.color === "#8b5cf6") markerId = "arrowhead-purple";
                  
                  return (
                    <TooltipProvider key={arrow.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <g className="pointer-events-auto cursor-pointer">
                            <path
                              d={arrow.path}
                              fill="none"
                              stroke={arrow.color}
                              strokeWidth="2"
                              strokeDasharray={arrow.linkType === "RELATES_TO" ? "5,5" : undefined}
                              markerEnd={`url(#${markerId})`}
                              className="transition-opacity hover:opacity-100 opacity-60"
                            />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex items-center gap-2">
                            <ArrowRightIcon className="h-3 w-3" />
                            <span>{linkTypeConfig[arrow.linkType]?.label || arrow.linkType}</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </svg>
            )}

            <ScrollArea className="h-[600px]">
              <div className="space-y-1">
                {processedTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div>No tasks in the selected time range</div>
                    </div>
                  </div>
                ) : (
                  processedTasks.map((task) => {
                    // Check if this task has any links
                    const taskLinks = visibleLinks.filter(
                      l => l.sourceWorkItemId === task.$id || l.targetWorkItemId === task.$id
                    );
                    const hasLinks = taskLinks.length > 0;
                    
                    return (
                      <div 
                        key={task.$id} 
                        className="flex hover:bg-muted/30 transition-colors relative"
                      >
                        {/* Task Info Column */}
                        <div className="w-80 p-4 border-r bg-background">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate flex-1" title={task.name}>
                                {task.isMilestone && <FlagIcon className="inline h-3 w-3 mr-1 text-orange-500" />}
                                {task.name}
                              </div>
                              {hasLinks && showArrows && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Link2Icon className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {taskLinks.length} linked item{taskLinks.length > 1 ? "s" : ""}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {task.status}
                              </Badge>
                              {task.isMilestone && (
                                <Badge variant="outline" className="text-xs">
                                  Milestone
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {task.assignee && (
                                <MemberAvatar 
                                  name={task.assignee.name} 
                                  className="h-5 w-5" 
                                />
                              )}
                              <div className="text-xs text-muted-foreground">
                                {format(task.taskStart, "MMM dd")}
                                {!task.isMilestone && ` - ${format(task.taskEnd, "MMM dd")}`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gantt Chart Column */}
                        <div className="flex-1 relative">
                          <div className="flex min-w-max relative">
                            {timelineDays.map((day) => (
                              <div
                                key={day.date.toISOString()}
                                className={cn(
                                  "flex-shrink-0 border-r border-border/30 relative",
                                  day.isWeekend && "bg-muted/10",
                                  day.isToday && "bg-primary/5 border-l border-primary/30",
                                  day.isWeekStart && "border-l-2 border-primary/10"
                                )}
                                style={{ 
                                  width: `${dayWidth}px`,
                                  height: "80px" 
                                }}
                              />
                            ))}

                            {/* Task Bar or Milestone */}
                            <div
                              ref={(el) => setTaskRef(task.$id, el)}
                              className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
                              style={{
                                left: `${task.startOffset * dayWidth}px`,
                                width: task.isMilestone ? `${dayWidth}px` : `${task.duration * dayWidth}px`,
                              }}
                              title={`${task.name} (${format(task.taskStart, "MMM dd")} - ${format(task.taskEnd, "MMM dd")})`}
                            >
                              {task.isMilestone ? (
                                // Milestone diamond
                                <div className="flex justify-center">
                                  <div
                                    className={cn(
                                      "w-4 h-4 transform rotate-45 border-2",
                                      Object.values(TaskStatus).includes(task.status as TaskStatus) 
                                        ? statusConfig[task.status as TaskStatus]?.color
                                        : "bg-gray-500",
                                      "hover:scale-110 transition-transform",
                                      hasLinks && showArrows && "ring-2 ring-offset-1 ring-blue-400"
                                    )}
                                  />
                                </div>
                              ) : (
                                // Task bar
                                <div
                                  className={cn(
                                    "h-6 rounded-md flex items-center px-2 text-white text-xs font-medium overflow-hidden shadow-sm hover:shadow-md transition-shadow",
                                    Object.values(TaskStatus).includes(task.status as TaskStatus) 
                                      ? statusConfig[task.status as TaskStatus]?.color
                                      : "bg-gray-500",
                                    hasLinks && showArrows && "ring-2 ring-offset-1 ring-blue-400/50"
                                  )}
                                  style={{
                                    minWidth: `${dayWidth}px`,
                                  }}
                                >
                                  <span className="truncate">{task.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
