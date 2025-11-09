"use client";

import { useState, useMemo } from "react";
import { Filter, List, Table as TableIcon, Loader2 } from "lucide-react";

import { useGetActivityLogs, useGetActivityStats } from "@/features/audit-logs/hooks/use-get-activity-logs";
import { ActivityLogCard } from "@/features/audit-logs/components/activity-log-list";
import { ActivityTableView } from "@/features/audit-logs/components/activity-table-view";
import { ActivityType, type ActivityLog } from "@/features/audit-logs/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

type EnrichedActivityLog = ActivityLog & { description: string };

type PageData = {
  data: EnrichedActivityLog[];
  nextCursor?: string;
  hasMore: boolean;
};

export default function AuditLogsPage() {
  const workspaceId = useWorkspaceId();
  
  const [selectedType, setSelectedType] = useState<ActivityType | "all">("all");
  const [selectedAction, setSelectedAction] = useState<"created" | "updated" | "deleted" | "all">("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [viewMode, setViewMode] = useState<"list" | "table">("table");

  // Memoize date range calculation to prevent re-renders
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "7d":
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return {
          startDate: sevenDaysAgo.toISOString(),
          endDate: new Date().toISOString(),
        };
      case "30d":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return {
          startDate: thirtyDaysAgo.toISOString(),
          endDate: new Date().toISOString(),
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }, [dateRange]); // Only recalculate when dateRange changes

  // Fetch activities with infinite query
  const { 
    data, 
    isLoading: isLoadingActivities, 
    error: activitiesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetActivityLogs({
    workspaceId,
    startDate,
    endDate,
    limit: 50,
  });

  // Flatten all pages into a single array
  const allActivities = useMemo((): EnrichedActivityLog[] => {
    if (!data?.pages) return [];
    return (data.pages as PageData[]).flatMap((page) => page.data);
  }, [data]);

  // Frontend filtering - filter the fetched data based on selected filters
  const activities = useMemo((): EnrichedActivityLog[] => {
    if (!allActivities) return [];

    return allActivities.filter((activity: EnrichedActivityLog) => {
      // Type filter
      if (selectedType !== "all" && activity.type !== selectedType) {
        return false;
      }

      // Action filter
      if (selectedAction !== "all" && activity.action !== selectedAction) {
        return false;
      }

      // User filter
      if (selectedUser !== "all" && activity.userId !== selectedUser) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all") {
        const activityStatus = activity.metadata?.status as string | undefined;
        if (!activityStatus || activityStatus !== selectedStatus) {
          return false;
        }
      }

      // Priority filter
      if (selectedPriority !== "all") {
        const activityPriority = activity.metadata?.priority as string | undefined;
        if (!activityPriority || activityPriority !== selectedPriority) {
          return false;
        }
      }

      return true;
    });
  }, [allActivities, selectedType, selectedAction, selectedUser, selectedStatus, selectedPriority]);

  const { data: stats, isLoading: isLoadingStats, error: statsError } = useGetActivityStats({
    workspaceId,
    startDate,
    endDate,
  });

  // Extract unique users from activities for user filter
  const uniqueUsers = useMemo(() => {
    if (!allActivities) return [];
    const usersMap = new Map<string, { id: string; name: string }>();
    
    allActivities.forEach((activity) => {
      if (activity.userId && activity.userName) {
        usersMap.set(activity.userId, {
          id: activity.userId,
          name: activity.userName,
        });
      }
    });
    
    return Array.from(usersMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [allActivities]);

  // Extract unique statuses from activities
  const uniqueStatuses = useMemo(() => {
    if (!allActivities) return [];
    const statuses = new Set<string>();
    
    allActivities.forEach((activity) => {
      const status = activity.metadata?.status as string | undefined;
      if (status) {
        statuses.add(status);
      }
    });
    
    return Array.from(statuses).sort();
  }, [allActivities]);

  // Extract unique priorities from activities
  const uniquePriorities = useMemo(() => {
    if (!allActivities) return [];
    const priorities = new Set<string>();
    
    allActivities.forEach((activity) => {
      const priority = activity.metadata?.priority as string | undefined;
      if (priority) {
        priorities.add(priority);
      }
    });
    
    return Array.from(priorities).sort();
  }, [allActivities]);

  // Show error if queries fail
  if (activitiesError || statsError) {
    return (
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Track all activities and changes in your workspace
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-muted-foreground">
              Failed to load activity logs. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Header with Statistics */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Track all activities and changes in your workspace
          </p>
        </div>
        
        {/* Statistics and View Toggle */}
        <div className="flex items-center gap-6">
          {/* Statistics Summary */}
          <div className="flex items-center gap-6 px-6 py-3 border rounded-lg bg-card">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  stats?.totalActivities || 0
                )}
              </span>
              <span className="text-xs text-muted-foreground">Activities</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  stats?.activitiesByType?.task || 0
                )}
              </span>
              <span className="text-xs text-muted-foreground">Tasks</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  stats?.activitiesByType?.project || 0
                )}
              </span>
              <span className="text-xs text-muted-foreground">Projects</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Filters - Compact Design with More Options */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border rounded-lg bg-card">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ActivityType | "all")}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ActivityType.TASK}>Tasks</SelectItem>
            <SelectItem value={ActivityType.PROJECT}>Projects</SelectItem>
            <SelectItem value={ActivityType.SPRINT}>Sprints</SelectItem>
            <SelectItem value={ActivityType.WORK_ITEM}>Work Items</SelectItem>
            <SelectItem value={ActivityType.MEMBER}>Members</SelectItem>
            <SelectItem value={ActivityType.TIME_LOG}>Time Logs</SelectItem>
            <SelectItem value={ActivityType.ATTACHMENT}>Attachments</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedAction} onValueChange={(value) => setSelectedAction(value as "created" | "updated" | "deleted" | "all")}>
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {uniquePriorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(value) => setDateRange(value as "7d" | "30d" | "all")}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Log */}
      {viewMode === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Activity History
            </CardTitle>
            <CardDescription>
              Detailed view of all activities with timestamps and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <ActivityTableView activities={activities || []} />
                
                {/* Load More Button */}
                {hasNextPage && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="gap-2"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More Activities"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ActivityLogCard
          workspaceId={workspaceId}
          activities={activities || []}
          isLoading={isLoadingActivities}
          title="Activity Feed"
        />
      )}
    </div>
  );
}
