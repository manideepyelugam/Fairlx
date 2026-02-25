"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Flag,
  ArrowUpRight,
  MoreHorizontal,
  PlusIcon,
  Layers,
} from "lucide-react";
import { TaskStatus, TaskPriority, Task } from "../types";
import { Member } from "@/features/members/types";
import { Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatDistanceToNow, format } from "date-fns";
import { useMemo } from "react";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { ProjectActivityLogWidget } from "@/features/audit-logs/components/project-activity-log-widget";
import { ProjectMembersWidget } from "@/features/members/components/project-members-widget";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetMySpaceMembers } from "@/features/my-space/api/use-get-my-space-members";

// Mini bar chart component for stat cards - uses semantic colors based on variant
const MiniBarChart = ({ value, max, variant = "default" }: { value: number; max: number; variant?: "default" | "dotted" | "blocks" }) => {
  const bars = 12
  const filledBars = Math.round((value / Math.max(max, 1)) * bars)

  // dotted variant - used for pending/warning states (amber)
  if (variant === "dotted") {
    return (
      <div className="flex items-end gap-0.5 h-6">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-sm ${i < filledBars ? 'bg-amber-500 dark:bg-amber-400' : 'bg-amber-100 dark:bg-slate-700'}`}
            style={{ height: `${18 + (i * 4) % 24 + 18}%` }}
          />
        ))}
      </div>
    )
  }

  // blocks variant - used for completed/success states (emerald)
  if (variant === "blocks") {
    return (
      <div className="flex items-end gap-1 h-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-5 rounded-sm ${i < Math.ceil(filledBars / 2) ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-emerald-100 dark:bg-slate-700'}`}
          />
        ))}
      </div>
    )
  }

  // default variant - neutral/black for totals
  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm ${i < filledBars ? 'bg-slate-900 dark:bg-slate-300' : 'bg-slate-300 dark:bg-slate-700'}`}
          style={{ height: `${26 + (i * 6) % 34 + 26}%` }}
        />
      ))}
    </div>
  )
}

interface DataDashboardProps {
  tasks?: Task[];
  isLoading?: boolean;
  isAggregated?: boolean;
}

export const DataDashboard = ({ tasks = [], isAggregated = false }: DataDashboardProps) => {
  const workspaceId = useWorkspaceId();
  const projectId = useProjectId();

  // Regular workspace members
  const { data: membersData } = useGetMembers({
    workspaceId,
    enabled: !isAggregated
  });

  // Aggregated My Space members
  const { data: mySpaceMembersData } = useGetMySpaceMembers();

  const members = useMemo(() => {
    if (isAggregated) return (mySpaceMembersData?.documents as unknown as Member[]) ?? [];
    return (membersData?.documents as unknown as Member[]) ?? [];
  }, [isAggregated, membersData?.documents, mySpaceMembersData?.documents]);

  // Calculate analytics from real tasks data
  const analytics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.IN_REVIEW).length;
    const pendingTasks = totalTasks - completedTasks;
    const flaggedTasks = tasks.filter(t => t.flagged === true).length;
    const now = new Date();
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now && t.status !== TaskStatus.DONE;
    }).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      flaggedTasks,
      overdueTasks,
      completionRate,
    };
  }, [tasks]);

  // Calculate monthly data for bar chart (unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _monthlyData = useMemo(() => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const currentMonth = now.getMonth();

    return months.map((month, idx) => {
      const monthIndex = (currentMonth - 4 + idx + 12) % 12;
      const monthItems = tasks.filter(t => {
        const createdDate = new Date(t.$createdAt);
        return createdDate.getMonth() === monthIndex;
      });
      const completedMonthItems = monthItems.filter(t => t.status === TaskStatus.DONE);

      return {
        name: month,
        total: monthItems.length,
        completed: completedMonthItems.length,
      };
    });
  }, [tasks]);

  // Calculate workload distribution from real data (unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _workloadDistribution = useMemo(() => {
    const memberWorkload = members.map(member => {
      const memberTasks = tasks.filter(t =>
        t.assigneeId === member.$id || t.assigneeIds?.includes(member.$id)
      );
      const completedTasks = memberTasks.filter(t =>
        t.status === TaskStatus.DONE
      ).length;

      return {
        id: member.$id,
        name: member.name || member.email || "Unknown",
        imageUrl: member.profileImageUrl,
        avatar: (member.name || member.email || "U").substring(0, 2).toUpperCase(),
        tasks: memberTasks.length,
        completedTasks,
      };
    }).filter(m => m.tasks > 0).sort((a, b) => b.tasks - a.tasks).slice(0, 4);

    return memberWorkload;
  }, [tasks, members]);

  // Calculate due alerts from real data
  const dueAlerts = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tasks
      .filter(t => {
        if (!t.dueDate || t.status === TaskStatus.DONE) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= now && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 6)
      .map(t => ({
        id: t.$id,
        title: t.name || t.title,
        dueDate: new Date(t.dueDate!),
      }));
  }, [tasks]);

  // Calculate recent tasks
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.$updatedAt || b.$createdAt).getTime() - new Date(a.$updatedAt || a.$createdAt).getTime())
      .slice(0, 5)
      .map(task => {
        const assignees = (task as Record<string, unknown>).assignees as { name?: string; email?: string; profileImageUrl?: string }[] || [];
        const firstAssignee = assignees[0];

        let assigneeName = "Unassigned";
        let assigneeImage = null;

        if (firstAssignee) {
          assigneeName = firstAssignee.name || firstAssignee.email || "Unknown";
          assigneeImage = firstAssignee.profileImageUrl;
        } else if (task.assigneeIds && task.assigneeIds.length > 0) {
          const member = members.find(m => m.$id === task.assigneeIds[0] || (m as Record<string, unknown>).userId === task.assigneeIds[0]);
          if (member) {
            assigneeName = member.name || "Unknown";
            assigneeImage = member.profileImageUrl;
          }
        } else if (task.assigneeId) {
          const member = members.find(m => m.$id === task.assigneeId || (m as Record<string, unknown>).userId === task.assigneeId);
          if (member) {
            assigneeName = member.name || "Unknown";
            assigneeImage = member.profileImageUrl;
          }
        }

        const projectName = ((task as Record<string, unknown>).project as Record<string, unknown>)?.name as string || "Unknown Project";

        return {
          id: task.$id,
          title: task.name || task.title,
          status: task.status === TaskStatus.DONE ? "Completed" :
            task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.IN_REVIEW ? "In Progress" : "To Do",
          assignee: assigneeName,
          assigneeImage: assigneeImage,
          priority: task.priority || "MEDIUM",
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          project: projectName,
        };
      });
  }, [tasks, members]);

  // Top contributors (unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _contributionData = useMemo(() => {
    return members.map(member => {
      const memberTasks = tasks.filter(t =>
        t.assigneeId === member.$id || t.assigneeIds?.includes(member.$id)
      );
      const completedTasks = memberTasks.filter(t =>
        t.status === TaskStatus.DONE
      ).length;

      return {
        id: member.$id,
        name: member.name || member.email?.split('@')[0] || "Unknown",
        imageUrl: member.profileImageUrl,
        completed: completedTasks,
        total: memberTasks.length,
      };
    }).filter(m => m.total > 0).sort((a, b) => b.completed - a.completed).slice(0, 5);
  }, [tasks, members]);

  // Priority distribution (enabled!)
  const priorityDistribution = useMemo(() => [
    { name: "URGENT", count: tasks.filter(t => t.priority === TaskPriority.URGENT).length, fill: "#ef4444" },
    { name: "HIGH", count: tasks.filter(t => t.priority === TaskPriority.HIGH).length, fill: "#f97316" },
    { name: "MEDIUM", count: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length, fill: "#eab308" },
    { name: "LOW", count: tasks.filter(t => t.priority === TaskPriority.LOW).length, fill: "#6b7280" },
  ], [tasks]);

  // Status overview for pie chart
  const statusOverview = useMemo(() => {
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
    const assigned = tasks.filter(t => t.status === TaskStatus.ASSIGNED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const inReview = tasks.filter(t => t.status === TaskStatus.IN_REVIEW).length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;

    return [
      { id: "done", name: "Done", value: done, color: "#10b981" },
      { id: "inProgress", name: "In Progress", value: inProgress, color: "#eab308" },
      { id: "inReview", name: "In Review", value: inReview, color: "#3b82f6" },
      { id: "todo", name: "To Do", value: todo, color: "#2762f3" },
      { id: "assigned", name: "Assigned", value: assigned, color: "#f87171" },
    ].filter(s => s.value > 0);
  }, [tasks]);

  return (
    <div className="h-full">
      <div className="max-w-[1600px] mx-auto">
        {/* Main Content - Full Width */}
        <div className="space-y-4">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Task Card */}
            <Card className="relative overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400 dark:bg-slate-500" />
              <div className="p-4 pl-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Tasks</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-muted">
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </Button>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">{analytics.totalTasks}</span>
                  <MiniBarChart value={analytics.totalTasks} max={analytics.totalTasks + 50} variant="default" />
                </div>
              </div>
            </Card>

            {/* Pending Task Card */}
            <Card className="relative overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              <div className="p-4 pl-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Pending Tasks</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-muted">
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </Button>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-semibold tracking-tight text-amber-500">{analytics.pendingTasks}</span>
                  <MiniBarChart value={analytics.pendingTasks} max={analytics.totalTasks} variant="dotted" />
                </div>
              </div>
            </Card>

            {/* Completed Task Card */}
            <Card className="relative overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <div className="p-4 pl-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Completed Tasks</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-muted">
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </Button>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-semibold tracking-tight text-emerald-500">{analytics.completedTasks}</span>
                  <MiniBarChart value={analytics.completedTasks} max={analytics.totalTasks} variant="blocks" />
                </div>
              </div>
            </Card>

            {/* Flagged Task Card */}
            <Card className="relative overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
              <div className="p-4 pl-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Flagged</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-muted">
                    <Flag className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </Button>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-semibold tracking-tight text-rose-500">{analytics.flaggedTasks}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 text-muted-foreground/70" />
                    <span>{analytics.overdueTasks} overdue</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Overview Pie Chart */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium tracking-tight text-foreground">Status Overview</h3>
              </div>
              {statusOverview.length > 0 ? (
                <>
                  <div className="h-[230px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusOverview}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusOverview.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex gap-8">
                    {statusOverview.map((status) => (
                      <div key={status.id} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-[11px] text-muted-foreground truncate">{status.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                  No task data available yet
                </div>
              )}
            </Card>



            {/* Priority Distribution Chart */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium tracking-tight text-foreground">Priority Distribution</h3>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={priorityDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-700" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {priorityDistribution.map((priority) => (
                  <div key={priority.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priority.fill }} />
                    <span className="text-[11px] text-muted-foreground">{priority.name}</span>
                    <span className="text-[11px] font-medium">{priority.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <ProjectActivityLogWidget
              workspaceId={workspaceId}
              projectId={isAggregated ? undefined : projectId}
              isAggregated={isAggregated}
              limit={6}
            />
          </div>

          {/* Task List Table */}
          <Card className="p-5 bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium tracking-tight text-foreground">Recent Tasks</h3>
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
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
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
                      <p className="text-sm text-foreground truncate">{task.project}</p>
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
                          ? "bg-yellow-100 text-amber-600 dark:bg-yellow-900/30 dark:text-amber-200"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${task.status === "Completed" ? "bg-emerald-600" :
                          task.status === "In Progress" ? "bg-amber-600" : "bg-slate-400"
                          }`} />
                        {task.status}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${task.priority === "URGENT" || task.priority === "HIGH"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                        : task.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No tasks yet. Create your first task to get started.
                </div>
              )}
            </div>
          </Card>



          {/* Bottom Section - Due Alerts & Team Members */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Due Alerts Card */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium tracking-tight text-foreground">Due Alerts</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-amber-500/10">
                  <PlusIcon className="h-4 w-4 text-amber-500" />
                </Button>
              </div>

              {dueAlerts.length > 0 ? (
                <div className="space-y-2">
                  {dueAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-amber-500/10 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs text-foreground truncate">{alert.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        Due {formatDistanceToNow(alert.dueDate, { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                  <p className="text-xs text-muted-foreground">You&apos;re all caught up!</p>
                </div>
              )}
            </Card>

            {/* Team Members */}
            <ProjectMembersWidget
              workspaceId={workspaceId}
              projectId={isAggregated ? undefined : projectId}
              isAggregated={isAggregated}
              limit={12}
            />
          </div>
        </div>
      </div>
    </div>
  );
};