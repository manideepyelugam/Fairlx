"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, parseISO, startOfDay, isSameDay, isWeekend } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, FlagIcon, ProjectorIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { TaskStatus, PopulatedTask } from "../types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { cn } from "@/lib/utils";

interface EnhancedTimelineProps {
  data: PopulatedTask[];
}

type ViewType = "week" | "month" | "quarter";

const statusConfig = {
  [TaskStatus.BACKLOG]: { 
    color: "bg-pink-500", 
    lightColor: "bg-pink-100", 
    borderColor: "border-pink-200",
    textColor: "text-pink-700"
  },
  [TaskStatus.ASSIGNED]: { 
    color: "bg-red-500", 
    lightColor: "bg-red-100", 
    borderColor: "border-red-200",
    textColor: "text-red-700"
  },
  [TaskStatus.IN_PROGRESS]: { 
    color: "bg-yellow-500", 
    lightColor: "bg-yellow-100", 
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700"
  },
  [TaskStatus.COMPLETED]: { 
    color: "bg-blue-500", 
    lightColor: "bg-blue-100", 
    borderColor: "border-blue-200",
    textColor: "text-blue-700"
  },
  [TaskStatus.CLOSED]: { 
    color: "bg-emerald-500", 
    lightColor: "bg-emerald-100", 
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700"
  },
};

export const EnhancedTimeline = ({ data }: EnhancedTimelineProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

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
        shortLabel: format(date, "dd"),
        isWeekStart: date.getDay() === 0,
        isWeekend: isWeekend(date),
        isToday: isSameDay(date, new Date())
      }));
    }
  }, [startDate, endDate, viewType]);

  const processedTasks = useMemo(() => {
    return data.map(task => {
      const taskStart = startOfDay(parseISO(task.dueDate));
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
        endOffset,
        isVisible,
        taskStart,
        taskEnd,
        isMilestone: taskStart.getTime() === taskEnd.getTime()
      };
    }).filter(task => task.isVisible);
  }, [data, startDate, endDate, timelineDays.length]);

  // Group tasks by project for better organization
  const tasksByProject = useMemo(() => {
    const grouped = processedTasks.reduce((acc, task) => {
      const projectId = task.projectId || 'no-project';
      const projectName = 'Project'; // We'll need to fetch project data separately
      
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectName,
          tasks: []
        };
      }
      acc[projectId].tasks.push(task);
      return acc;
    }, {} as Record<string, { projectId: string; projectName: string; tasks: PopulatedTask[] }>);

    return Object.values(grouped);
  }, [processedTasks]);

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

  return (
    <TooltipProvider>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Enhanced Timeline
            </CardTitle>
            
            <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-2">
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

          <div className="text-sm text-muted-foreground">
            {format(startDate, "MMM dd, yyyy")} - {format(endDate, "MMM dd, yyyy")}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t">
            {/* Timeline Header */}
            <div className="flex bg-muted/30 sticky top-0 z-10">
              <div className="w-80 p-4 border-r bg-background">
                <div className="font-medium text-sm flex items-center gap-2">
                  <ProjectorIcon className="h-4 w-4" />
                  Projects & Tasks
                </div>
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

            {/* Timeline Content */}
            <ScrollArea className="h-[700px]">
              <div className="space-y-1">
                {tasksByProject.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div>No tasks in the selected time range</div>
                    </div>
                  </div>
                ) : (
                  tasksByProject.map((projectGroup) => (
                    <div key={projectGroup.projectId} className="border-b border-border/30">
                      {/* Project Header */}
                      <div className="flex bg-muted/20 sticky top-16 z-5">
                        <div className="w-80 p-3 border-r bg-background">
                          <div className="flex items-center gap-2">
                            <ProjectorIcon className="h-4 w-4" />
                            <span className="font-medium text-sm">{projectGroup.projectName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {projectGroup.tasks.length}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex min-w-max">
                            {timelineDays.map((day) => (
                              <div
                                key={day.date.toISOString()}
                                className={cn(
                                  "border-r border-border/30",
                                  day.isWeekend && "bg-muted/10",
                                  day.isToday && "bg-primary/5"
                                )}
                                style={{ width: `${dayWidth}px`, height: "40px" }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Project Tasks */}
                      {projectGroup.tasks.map((task) => (
                        <div 
                          key={task.$id} 
                          className={cn(
                            "flex hover:bg-muted/30 transition-colors relative",
                            selectedTask === task.$id && "bg-primary/5"
                          )}
                        >
                          {/* Task Info Column */}
                          <div className="w-80 p-4 border-r bg-background">
                            <div className="space-y-2">
                              <div className="font-medium text-sm truncate" title={task.name}>
                                {task.isMilestone && <FlagIcon className="inline h-3 w-3 mr-1 text-orange-500" />}
                                {task.name}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-xs px-2 py-0.5",
                                    Object.values(TaskStatus).includes(task.status as TaskStatus) 
                                      ? statusConfig[task.status as TaskStatus]?.borderColor
                                      : "border-gray-200"
                                  )}
                                >
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
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <MemberAvatar 
                                        name={task.assignee.name} 
                                        className="h-5 w-5" 
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{task.assignee.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute top-1/2 transform -translate-y-1/2 cursor-pointer"
                                    style={{
                                      left: `${task.startOffset * dayWidth}px`,
                                      width: task.isMilestone ? `${dayWidth}px` : `${task.duration * dayWidth}px`,
                                    }}
                                    onClick={() => setSelectedTask(selectedTask === task.$id ? null : task.$id)}
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
                                            "hover:scale-110 transition-transform"
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
                                          selectedTask === task.$id && "ring-2 ring-primary ring-offset-1"
                                        )}
                                        style={{
                                          minWidth: `${dayWidth}px`,
                                        }}
                                      >
                                        <span className="truncate">{task.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{task.name}</p>
                                    <p className="text-xs">
                                      {task.isMilestone ? 'Milestone: ' : 'Duration: '}
                                      {format(task.taskStart, "MMM dd, yyyy")}
                                      {!task.isMilestone && ` - ${format(task.taskEnd, "MMM dd, yyyy")}`}
                                    </p>
                                    <p className="text-xs">Status: {task.status}</p>
                                    {task.assignee && (
                                      <p className="text-xs">Assignee: {task.assignee.name}</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
