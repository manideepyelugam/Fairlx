"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, FlagIcon, ClockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { TaskStatus, PopulatedTask } from "../types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { cn } from "@/lib/utils";

interface CalendarMilestonesProps {
  data: PopulatedTask[];
}

const statusConfig: Record<string, { color: string; textColor: string }> = {
  [TaskStatus.TODO]: { color: "bg-gray-500", textColor: "text-gray-700" },
  [TaskStatus.ASSIGNED]: { color: "bg-red-500", textColor: "text-red-700" },
  [TaskStatus.IN_PROGRESS]: { color: "bg-yellow-500", textColor: "text-yellow-700" },
  [TaskStatus.IN_REVIEW]: { color: "bg-blue-500", textColor: "text-blue-700" },
  [TaskStatus.DONE]: { color: "bg-emerald-500", textColor: "text-emerald-700" },
};

export const CalendarMilestones = ({ data }: CalendarMilestonesProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Process tasks for the calendar
  const tasksWithDates = useMemo(() => {
    return data.map(task => {
      const startDate = new Date(task.dueDate || new Date().toISOString());
      const endDate = task.endDate ? new Date(task.endDate) : startDate;
      const isMilestone = startDate.getTime() === endDate.getTime();
      
      return {
        ...task,
        startDate,
        endDate,
        isMilestone
      };
    });
  }, [data]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    type TaskWithDateInfo = typeof tasksWithDates[0] & { isEndDate?: boolean };
    const grouped: Record<string, TaskWithDateInfo[]> = {};
    
    tasksWithDates.forEach(task => {
      const dateKey = format(task.startDate, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
      
      // If task has end date different from start, add to end date too
      if (!task.isMilestone) {
        const endDateKey = format(task.endDate, 'yyyy-MM-dd');
        if (endDateKey !== dateKey) {
          if (!grouped[endDateKey]) {
            grouped[endDateKey] = [];
          }
          grouped[endDateKey].push({ ...task, isEndDate: true });
        }
      }
    });
    
    return grouped;
  }, [tasksWithDates]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get milestones and upcoming deadlines
  const milestones = tasksWithDates.filter(task => task.isMilestone);
  const upcomingDeadlines = tasksWithDates
    .filter(task => !task.isMilestone && task.endDate >= new Date())
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    .slice(0, 5);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar & Milestones
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
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
                onClick={() => navigateMonth("next")}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-lg font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Calendar View */}
        <Card className="xl:col-span-3">
          <CardContent className="p-0">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[120px] p-2 border-r border-b last:border-r-0",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      isTodayDate && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isTodayDate && "text-primary font-bold"
                    )}>
                      {format(day, "d")}
                      {isTodayDate && (
                        <div className="w-2 h-2 bg-primary rounded-full inline-block ml-1" />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task, taskIndex) => (
                        <div
                          key={`${task.$id}-${taskIndex}`}
                          className={cn(
                            "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity",
                            Object.values(TaskStatus).includes(task.status as TaskStatus)
                              ? statusConfig[task.status as TaskStatus]?.color
                              : "bg-gray-500",
                            "text-white"
                          )}
                          title={`${task.name} - ${task.status}`}
                        >
                          {task.isMilestone && <FlagIcon className="inline h-2 w-2 mr-1" />}
                          {task.isEndDate && <ClockIcon className="inline h-2 w-2 mr-1" />}
                          {task.name}
                        </div>
                      ))}
                      
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Milestones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlagIcon className="h-4 w-4" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {milestones.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No milestones found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.$id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-sm truncate">
                          {milestone.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {milestone.status}
                          </Badge>
                          {milestone.assignee && (
                            <MemberAvatar 
                              name={milestone.assignee.name} 
                              className="h-4 w-4" 
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(milestone.startDate, "MMM dd, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No upcoming deadlines
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((task) => (
                      <div
                        key={task.$id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-sm truncate">
                          {task.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {task.status}
                          </Badge>
                          {task.assignee && (
                            <MemberAvatar 
                              name={task.assignee.name} 
                              className="h-4 w-4" 
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Due: {format(task.endDate, "MMM dd, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
