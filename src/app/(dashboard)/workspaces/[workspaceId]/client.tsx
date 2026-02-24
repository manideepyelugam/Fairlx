"use client"
import { cn } from "@/lib/utils"
import { PageError } from "@/components/page-error"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useGetMembers } from "@/features/members/api/use-get-members"
import { MemberAvatar } from "@/features/members/components/member-avatar"
import { useGetProjects } from "@/features/projects/api/use-get-projects"
import { useGetWorkItems } from "@/features/sprints/api/use-get-work-items"
import { WorkItemStatus, type PopulatedWorkItem } from "@/features/sprints/types"
import { useGetWorkspaceAnalytics } from "@/features/workspaces/api/use-get-workspace-analytics"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { useCurrent } from "@/features/auth/api/use-current"

import { formatDistanceToNow, format } from "date-fns"
import {
  PlusIcon,
  SettingsIcon,
  Users,
  Clock,
  Layers,
  FolderKanban,
  ExternalLink,
  TrendingUp,
  ArrowUpRight,
  MoreHorizontal,
  FileText,
  CheckCircle2,
} from "lucide-react"
import { useMemo } from "react"
import Link from "next/link";

import {
  DashboardStatsSkeleton,
  DashboardChartsSkeleton,
  DashboardTasksSkeleton,
} from "./components/workspace-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniBarChart } from "./components/mini-bar-chart";
import { WorkspaceProjectOverviewChart } from "./components/workspace-project-overview-chart";
import { WorkspacePriorityDistributionChart } from "./components/workspace-priority-distribution-chart";

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId()
  const { data: user } = useCurrent()
  const { data: analytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId })
  const { data: workItems, isLoading: isLoadingWorkItems } = useGetWorkItems({ workspaceId, limit: 50 })
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

  const totalTasks = analytics?.taskCount || 0;
  const completedTasks = analytics?.completedTaskCount || 0;
  const pendingTasks = analytics?.incompleteTaskCount || 0;

  // Use pre-aggregated data from analytics to avoid heavy client-side processing
  const dynamicData = useMemo(() => {
    if (!analytics || !members?.documents) {
      return {
        statusOverview: [],
        priorityDistribution: [],
        memberWorkload: [],
        recentWorkItems: [],
        dueSoonWorkItems: [],
        completionRate: 0,
        flaggedCount: 0,
        contributionData: [],
        monthlyData: [],
        projectStats: [],
      }
    }

    const {
      statusDistribution = [],
      priorityDistribution = [],
      monthlyData = [],
      memberWorkload: serverWorkload = [],
      contributionData: serverContribution = [],
      taskCount = 0,
      completedTaskCount = 0,
    } = analytics;

    // Map server-side member specific data back to member names/avatars
    const memberWorkload = (serverWorkload as { id: string; tasks: number; completedTasks: number }[]).map((sw) => {
      const member = members.documents.find(m => m.$id === sw.id);
      return {
        ...sw,
        name: member?.name || "Unknown",
        imageUrl: member?.profileImageUrl,
        avatar: (member?.name || "U").substring(0, 2).toUpperCase(),
      };
    });

    const contributionData = (serverContribution as { id: string; completed: number; total: number }[]).map((sc) => {
      const member = members.documents.find(m => m.$id === sc.id);
      return {
        ...sc,
        name: member?.name || "Unknown",
        imageUrl: member?.profileImageUrl,
      };
    });

    const completionRate = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

    // Recent work items (from the limited fetch)
    const recentWorkItems = (workItems?.documents as PopulatedWorkItem[] || [])
      .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
      .slice(0, 5)
      .map((item) => {
        const assignee = item.assignees?.[0]
        return {
          id: item.$id,
          title: item.title,
          status: item.status === WorkItemStatus.DONE ? "Completed" :
            item.status === WorkItemStatus.IN_PROGRESS || item.status === WorkItemStatus.IN_REVIEW ? "In Progress" : "To Do",
          assignee: assignee?.name || "Unassigned",
          assigneeImage: assignee?.profileImageUrl,
          priority: item.priority || "MEDIUM",
          projectId: item.projectId,
          project: item.project?.name || "No Project",
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
        }
      });

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Due soon (from the limited fetch)
    const dueSoonWorkItems = (workItems?.documents as PopulatedWorkItem[] || [])
      .filter((item) => {
        if (!item.dueDate || item.status === WorkItemStatus.DONE) return false
        const dueDate = new Date(item.dueDate)
        return dueDate >= now && dueDate <= weekFromNow
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 6)
      .map((t) => ({
        id: t.$id,
        title: t.title,
        dueDate: new Date(t.dueDate!),
      }))

    // Project stats (using the limited items we have on the client)
    const projectStats = projects?.documents?.slice(0, 3).map((project, idx) => {
      const projectItems = (workItems?.documents as PopulatedWorkItem[] || []).filter((t) => t.projectId === project.$id)
      const dueSoon = projectItems.filter((t) => {
        if (!t.dueDate || t.status === WorkItemStatus.DONE) return false
        const dueDate = new Date(t.dueDate)
        return dueDate >= now && dueDate <= weekFromNow
      }).length

      return {
        id: project.$id,
        name: project.name,
        dueSoon,
        rank: idx + 1,
      }
    }) || []

    return {
      statusOverview: statusDistribution,
      priorityDistribution,
      memberWorkload,
      recentWorkItems,
      dueSoonWorkItems,
      completionRate,
      flaggedCount: 0, // Assuming flaggedCount is not directly from analytics or needs calculation
      contributionData,
      monthlyData,
      projectStats,
    }
  }, [analytics, workItems, members, projects])

  // Removed the global PageLoader block to enable decoupling
  if (!analytics && isLoadingAnalytics) {
    // Optional: You could still return a full shell skeleton here if you want
  }

  // Handle errors
  if (!isLoadingAnalytics && !analytics) {
    return <PageError message="Failed to load workspace analytics." />
  }


  return (
    <div className="h-full  ">
      <div className=" max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Ready to conquer your projects?</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome Back, {user?.name?.split(' ')[0] || "User"}.
          </h1>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Section - Stats and Charts (9 columns) */}
          <div className="col-span-12 xl:col-span-9 space-y-4">
            {/* Top Stats Row */}
            {isLoadingAnalytics ? (
              <DashboardStatsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Total Tasks Card */}
                <Card className="p-4 bg-card border border-border shadow-sm hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                      <Layers className="h-4 w-4 text-blue-500" />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-foreground">{totalTasks}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Total Tasks</div>
                    </div>
                    <MiniBarChart value={totalTasks} max={totalTasks + 50} variant="default" />
                  </div>
                </Card>

                {/* Pending Tasks Card */}
                <Card className="p-4 bg-card border border-border shadow-sm hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-amber-500">{pendingTasks}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Pending Tasks</div>
                    </div>
                    <MiniBarChart value={pendingTasks} max={totalTasks} variant="dotted" />
                  </div>
                </Card>

                {/* Completed Tasks Card */}
                <Card className="p-4 bg-card border border-border shadow-sm hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-emerald-500">{completedTasks}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Completed Tasks</div>
                    </div>
                    <MiniBarChart value={completedTasks} max={totalTasks} variant="blocks" />
                  </div>
                </Card>
              </div>
            )}

            {/* Charts Row */}
            {isLoadingAnalytics ? (
              <DashboardChartsSkeleton />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Project Overview Chart */}
                <Card className="p-5 bg-card border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-medium tracking-tight text-foreground">Project Overview</h3>
                    <select className="text-xs bg-muted text-foreground px-2 py-1 rounded-md border border-border focus:ring-2 focus:ring-primary cursor-pointer">
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>This Year</option>
                    </select>
                  </div>
                  <div className="h-[240px]">
                    <WorkspaceProjectOverviewChart data={dynamicData.monthlyData} />
                  </div>
                </Card>

                {/* Task Statistics Card */}
                <Card className="p-5 bg-card border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium tracking-tight text-foreground">Task Statistics</h3>
                    <select className="text-xs bg-muted text-foreground px-2 py-1 rounded-md border border-border focus:ring-2 focus:ring-primary cursor-pointer">
                      <option>Monthly</option>
                      <option>Weekly</option>
                      <option>Daily</option>
                    </select>
                  </div>

                  {/* Total Project Count with Trend */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-foreground">{totalTasks}</span>
                      <span className="text-xs text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ↑ {dynamicData.completionRate}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                  </div>

                  {/* Status Legend */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span className="text-xs text-muted-foreground">Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-600" />
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                  </div>

                  {/* Progress Bar Visualization */}
                  <div className="h-3 flex rounded-full overflow-hidden bg-muted mb-6">
                    <div
                      className="bg-emerald-600 transition-all"
                      style={{ width: `${(completedTasks / Math.max(totalTasks, 1)) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 transition-all"
                      style={{ width: `${(pendingTasks / Math.max(totalTasks, 1)) * 100}%` }}
                    />
                  </div>

                  {/* In Progress / Completed Files */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">In Progress</p>
                      <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                        <div className="p-1.5 bg-amber-500/20 rounded">
                          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-foreground">Active Items</p>
                          <p className="text-[10px] text-muted-foreground">{pendingTasks} tasks</p>
                        </div>
                      </div>
                      <Progress value={pendingTasks > 0 ? Math.min((pendingTasks / totalTasks) * 100, 100) : 0} className="h-1 bg-amber-500/20 [&>div]:bg-amber-500" />
                      <p className="text-[10px] text-muted-foreground">Progress... {pendingTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Completed</p>
                      <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                        <div className="p-1.5 bg-emerald-500/20 rounded">
                          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-foreground">Done Items</p>
                          <p className="text-[10px] text-muted-foreground">{completedTasks} tasks</p>
                        </div>
                      </div>
                      <Progress value={completedTasks > 0 ? Math.min((completedTasks / totalTasks) * 100, 100) : 0} className="h-1 bg-emerald-500/20 [&>div]:bg-emerald-500" />
                      <p className="text-[10px] text-muted-foreground">Completed {completedTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Task List Table */}
            {isLoadingWorkItems ? (
              <DashboardTasksSkeleton />
            ) : (
              <Card className="p-5 bg-card border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium tracking-tight text-foreground">Task List</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-3 border-b border-border text-xs font-medium text-muted-foreground">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Project</div>
                  <div className="col-span-2">Time</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Priority</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {dynamicData.recentWorkItems.length > 0 ? (
                    dynamicData.recentWorkItems.map((task) => (
                      <Link
                        key={task.id}
                        href={`/workspaces/${workspaceId}/tasks/${task.id}`}
                        className="grid grid-cols-12 gap-4 py-3 items-center hover:bg-accent -mx-5 px-5 transition-colors"
                      >
                        <div className="col-span-4 flex items-center gap-3">
                          <MemberAvatar
                            name={task.assignee}
                            imageUrl={task.assigneeImage}
                            className="h-8 w-8"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">{task.assignee}</p>
                            <p className="text-xs text-muted-foreground truncate">{task.title}</p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm truncate text-foreground">{task.project}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">
                            {task.dueDate ? format(task.dueDate, 'MMM d') : '—'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${task.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : task.status === "In Progress"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-muted text-muted-foreground"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${task.status === "Completed" ? "bg-emerald-600" :
                              task.status === "In Progress" ? "bg-amber-600" : "bg-muted-foreground"
                              }`} />
                            {task.status}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${task.priority === "URGENT"
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                            : task.priority === "HIGH"
                              ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                              : task.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                            }`}>
                            {task.priority}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No tasks yet. Create your first task to get started.
                    </div>
                  )}
                </div>

                {workItems?.total && workItems.total > 5 && (
                  <Link href={`/workspaces/${workspaceId}/tasks`}>
                    <Button variant="ghost" size="sm" className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                      View All Tasks <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </Card>
            )}


          </div>

          {/* Right Sidebar (3 columns) */}
          <div className="col-span-12 xl:col-span-3 flex flex-col space-y-4 h-full">
            {/* Due Alerts Card */}
            {isLoadingWorkItems ? (
              <Card className="p-5 flex-1"><Skeleton className="h-5 w-24 mb-4" /><Skeleton className="h-32 w-full rounded-xl" /></Card>
            ) : (
              <Card className="p-5 bg-card border border-border shadow-sm flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium tracking-tight text-foreground">Due Alerts</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent">
                    <PlusIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                {dynamicData.dueSoonWorkItems.length > 0 ? (
                  <div className="space-y-3">
                    {dynamicData.dueSoonWorkItems.slice(0, 1).map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/workspaces/${workspaceId}/tasks/${alert.id}`}
                        className="block p-4 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate mb-1">{alert.title}</p>
                            <p className="text-xs opacity-90">
                              Due: {format(alert.dueDate, 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-blue-500">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-3 bg-white text-blue-600 hover:bg-blue-50 border-0"
                        >
                          <Clock className="mr-2 h-3 w-3" />
                          View Details
                        </Button>
                      </Link>
                    ))}

                    {dynamicData.dueSoonWorkItems.slice(1, 4).map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/workspaces/${workspaceId}/tasks/${alert.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(alert.dueDate, { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted/50 dark:text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                  </div>
                )}
              </Card>
            )}

            {/* Task Statistics by Project */}
            {isLoadingProjects || isLoadingWorkItems ? (
              <Card className="p-5 flex-1"><Skeleton className="h-5 w-32 mb-4" /><div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></Card>
            ) : (
              <Card className="p-5 bg-card border border-border shadow-sm flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium tracking-tight text-foreground">Project Statistics</h3>
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {projects?.documents?.slice(0, 5).map((project, idx) => {
                    const projectItems = (workItems?.documents as PopulatedWorkItem[] || []).filter(t => t.projectId === project.$id)
                    const dueSoon = projectItems.filter(t => {
                      if (!t.dueDate || t.status === WorkItemStatus.DONE) return false
                      const dueDate = new Date(t.dueDate)
                      const now = new Date()
                      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                      return dueDate >= now && dueDate <= weekFromNow
                    }).length

                    return (
                      <Link
                        key={project.$id}
                        href={`/workspaces/${workspaceId}/projects/${project.$id}`}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          idx === 0 ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-accent"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold",
                          idx === 0 ? "bg-white/20 text-white" : "bg-muted text-foreground"
                        )}>
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            idx === 0 ? "text-white" : "text-foreground"
                          )}>{project.name}</p>
                          <p className={cn(
                            "text-xs",
                            idx === 0 ? "text-blue-100" : "text-muted-foreground"
                          )}>
                            {dueSoon > 0 ? `${dueSoon} tasks due soon` : `${projectItems.length} total tasks`}
                          </p>
                        </div>

                      </Link>
                    )
                  })}

                  {projects?.total === 0 && (
                    <div className="text-center py-8">
                      <FolderKanban className="h-8 w-8 text-muted/50 dark:text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No projects yet</p>
                    </div>
                  )}
                </div>

                {projects?.total && projects.total > 5 && (
                  <Link href={`/workspaces/${workspaceId}/projects`}>
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent">
                      View All Projects <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </Card>
            )}

            {/* Team Members Quick View */}
            {isLoadingMembers ? (
              <Card className="p-5 flex-1"><Skeleton className="h-5 w-32 mb-4" /><div className="flex gap-2"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-10 w-10 rounded-full" /></div></Card>
            ) : (
              <Card className="p-5 bg-card border border-border shadow-sm flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium tracking-tight text-foreground">Team Members</h3>
                  <Link href={`/workspaces/${workspaceId}/members`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent">
                      <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {members?.documents?.slice(0, 8).map((member) => (
                    <MemberAvatar
                      key={member.$id}
                      name={member.name || member.email || "U"}
                      imageUrl={member.profileImageUrl}
                      className="h-10 w-10 border-2 border-border"
                    />
                  ))}
                  {members?.total && members.total > 8 && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      +{members.total - 8}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">Total Members</span>
                    <span className="font-semibold text-foreground">{members?.total || 0}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Row - Workload, Priority & Top Contributors */}
        <div className="grid grid-cols-1 w-full mt-4  lg:grid-cols-3 gap-4">
          {/* Workload Distribution */}
          <Card className="p-5 bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium tracking-tight text-foreground">Workload Distribution</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {dynamicData.memberWorkload.length > 0 ? (
                dynamicData.memberWorkload.map((member) => {
                  const workloadPercentage = analytics && analytics.taskCount > 0 ? (member.tasks / analytics.taskCount) * 100 : 0
                  return (
                    <div key={member.id} className="space-y-2 pt-2 ">
                      <div className="flex items-center gap-3">
                        <MemberAvatar
                          name={member.name}
                          imageUrl={member.imageUrl}
                          className="h-8 w-8"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate text-foreground">{member.name}</p>
                            <span className="text-xs text-muted-foreground">{member.tasks} tasks</span>
                          </div>
                          <Progress
                            value={workloadPercentage}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-center text-muted-foreground py-8">
                  No assigned tasks yet
                </div>
              )}
            </div>
          </Card>

          {/* Priority Distribution */}
          <Card className="p-5 bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium tracking-tight text-foreground">Priority Distribution</h3>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-[200px]">
              <WorkspacePriorityDistributionChart data={dynamicData.priorityDistribution} />
            </div>
          </Card>

          {/* Top Contributors */}
          <Card className="p-5 bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium tracking-tight text-foreground">Top Contributors</h3>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            {isLoadingAnalytics || isLoadingMembers ? (
              <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : dynamicData.contributionData.length > 0 ? (
              <div className="space-y-3">
                {dynamicData.contributionData.slice(0, 5).map((contributor) => (
                  <div key={contributor.id} className="flex items-center py-1 gap-3">

                    <MemberAvatar
                      name={contributor.name}
                      imageUrl={contributor.imageUrl}
                      className="h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">{contributor.completed} completed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{contributor.completed}</p>
                      <p className="text-xs text-muted-foreground">/{contributor.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-center">
                <TrendingUp className="h-8 w-8 text-muted/50 dark:text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No completed tasks yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
