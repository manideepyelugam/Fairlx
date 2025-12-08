"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, parseISO, startOfDay } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { TaskStatus, PopulatedTask } from "../types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { cn } from "@/lib/utils";

interface TimelineGanttProps {
  data: PopulatedTask[];
}

type ViewType = "week" | "month" | "quarter";

const statusColorMap: Record<string, string> = {
  [TaskStatus.TODO]: "bg-gray-500",
  [TaskStatus.ASSIGNED]: "bg-red-500",
  [TaskStatus.IN_PROGRESS]: "bg-yellow-500",
  [TaskStatus.IN_REVIEW]: "bg-blue-500",
  [TaskStatus.DONE]: "bg-emerald-500",
};

const statusBorderMap: Record<string, string> = {
  [TaskStatus.TODO]: "border-gray-200",
  [TaskStatus.ASSIGNED]: "border-red-200",
  [TaskStatus.IN_PROGRESS]: "border-yellow-200",
  [TaskStatus.IN_REVIEW]: "border-blue-200",
  [TaskStatus.DONE]: "border-emerald-200",
};

export const TimelineGantt = ({ data }: TimelineGanttProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("week");

  // Calculate date range based on view type
  const { startDate, endDate } = useMemo(() => {
    const start = startOfWeek(currentDate);
    let end: Date;
    let unit: string;

    switch (viewType) {
      case "week":
        end = endOfWeek(currentDate);
        unit = "day";
        break;
      case "month":
        end = addDays(start, 30);
        unit = "day";
        break;
      case "quarter":
        end = addDays(start, 90);
        unit = "week";
        break;
      default:
        end = endOfWeek(currentDate);
        unit = "day";
    }

    return { startDate: start, endDate: end, timelineUnit: unit };
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
          isWeekStart: true
        });
        current = addDays(current, 7);
      }
      return weeks;
    } else {
      // For week and month view, show days
      return eachDayOfInterval({ start: startDate, end: endDate }).map(date => ({
        date,
        label: format(date, viewType === "week" ? "EEE dd" : "dd"),
        isWeekStart: date.getDay() === 0
      }));
    }
  }, [startDate, endDate, viewType]);

  const processedTasks = useMemo(() => {
    return data
      .filter(task => task.dueDate)
      .map(task => {
        const taskStart = startOfDay(parseISO(task.dueDate!));
        const taskEnd = task.endDate ? startOfDay(parseISO(task.endDate)) : taskStart;
      
      // Calculate position and width
      const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
      const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
      
      // Only show tasks that intersect with current view
      const isVisible = taskStart <= endDate && taskEnd >= startDate;

      return {
        ...task,
        startOffset,
        duration,
        isVisible,
        taskStart,
        taskEnd
      };
    }).filter(task => task.isVisible);
  }, [data, startDate, endDate]);

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

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Timeline & Gantt Chart
          </CardTitle>
          
          <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-2">
            {/* View Type Selector */}
            <div className="flex border rounded-lg p-1">
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
                className="px-4"
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
          <div className="flex bg-muted/50">
            <div className="w-80 p-4 border-r bg-background">
              <div className="font-medium text-sm">Tasks</div>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex min-w-max">
                {timelineDays.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className={cn(
                      "flex-shrink-0 p-2 text-center border-r border-border/50",
                      viewType === "quarter" ? "w-20" : "w-16",
                      day.isWeekStart && "border-l-2 border-primary/20"
                    )}
                  >
                    <div className="text-xs font-medium">{day.label}</div>
                    {viewType !== "quarter" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(day.date, "dd")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Timeline Content */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-1">
              {processedTasks.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No tasks in the selected time range
                </div>
              ) : (
                processedTasks.map((task) => (
                  <div key={task.$id} className="flex hover:bg-muted/50 transition-colors">
                    {/* Task Info Column */}
                    <div className="w-80 p-4 border-r bg-background">
                      <div className="space-y-2">
                        <div className="font-medium text-sm truncate" title={task.name}>
                          {task.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs px-2 py-0.5",
                              Object.values(TaskStatus).includes(task.status as TaskStatus) 
                                ? statusBorderMap[task.status as TaskStatus]
                                : "border-gray-200"
                            )}
                          >
                            {task.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.assignee && (
                            <MemberAvatar 
                              name={task.assignee.name} 
                              className="h-5 w-5" 
                            />
                          )}
                          {task.project && (
                            <ProjectAvatar 
                              name={task.project.name} 
                              image={'imageUrl' in task.project ? (task.project as { imageUrl?: string }).imageUrl || "" : ""}
                              className="h-5 w-5"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gantt Chart Column */}
                    <div className="flex-1 relative">
                      <div className="flex min-w-max relative h-full">
                        {timelineDays.map((day) => (
                          <div
                            key={day.date.toISOString()}
                            className={cn(
                              "flex-shrink-0 border-r border-border/30 relative",
                              viewType === "quarter" ? "w-20" : "w-16",
                              day.isWeekStart && "border-l-2 border-primary/10"
                            )}
                            style={{ height: "80px" }}
                          >
                            {/* Today indicator */}
                            {format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
                              <div className="absolute inset-0 bg-primary/5 border-l-2 border-primary" />
                            )}
                          </div>
                        ))}

                        {/* Task Bar */}
                        <div
                          className="absolute top-1/2 transform -translate-y-1/2 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          style={{
                            left: `${task.startOffset * (viewType === "quarter" ? 80 : 64)}px`,
                            width: `${task.duration * (viewType === "quarter" ? 80 : 64)}px`,
                            height: "24px",
                            minWidth: viewType === "quarter" ? "80px" : "64px",
                          }}
                        >
                          <div
                            className={cn(
                              "h-full rounded-md flex items-center px-2 text-white text-xs font-medium overflow-hidden",
                              Object.values(TaskStatus).includes(task.status as TaskStatus) 
                                ? statusColorMap[task.status as TaskStatus]
                                : "bg-gray-500"
                            )}
                            title={`${task.name} (${format(task.taskStart, "MMM dd")} - ${format(task.taskEnd, "MMM dd")})`}
                          >
                            <span className="truncate">{task.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
