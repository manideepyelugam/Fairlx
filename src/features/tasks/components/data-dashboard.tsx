"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertCircle,
  Users,
  Layers,
  Flag, 
} from "lucide-react";
import { TaskStatus, TaskPriority, Task } from "../types";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { ProjectActivityLogWidget } from "@/features/audit-logs/components/project-activity-log-widget";
import { ProjectMembersWidget } from "@/features/members/components/project-members-widget";

interface DataDashboardProps {
  tasks?: Task[];
  isLoading?: boolean;
}

export const DataDashboard = ({ tasks = [] }: DataDashboardProps) => {
  const workspaceId = useWorkspaceId();
  const projectId = useProjectId();
  const { data: membersData } = useGetMembers({ workspaceId });
  
  // Memoize members to prevent dependency issues in other useMemo hooks
  const members = useMemo(() => membersData?.documents ?? [], [membersData?.documents]);

  // Calculate analytics from real tasks data
  const analytics = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CLOSED).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const flaggedTasks = tasks.filter(t => t.flagged === true).length;
    const now = new Date();
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CLOSED;
    }).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      flaggedTasks,
      overdueTasks,
    };
  }, [tasks]);

  // Calculate status overview from real data
  const statusOverview = useMemo(() => {
    const assigned = tasks.filter(t => t.status === TaskStatus.ASSIGNED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const closed = tasks.filter(t => t.status === TaskStatus.CLOSED).length;

    return [
      { id: "status-1", name: "Completed", value: completed + closed, color: "#22c55e" },
      { id: "status-2", name: "In Progress", value: inProgress, color: "#2663ec" },
      { id: "status-3", name: "Assigned", value: assigned, color: "#93c5fd" },
    ];
  }, [tasks]);

  // Calculate workload distribution from real data
  const workloadDistribution = useMemo(() => {
    const memberWorkload = members.map(member => {
      const memberTasks = tasks.filter(t => 
        t.assigneeId === member.$id || t.assigneeIds?.includes(member.$id)
      );
      const completedTasks = memberTasks.filter(t => 
        t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CLOSED
      ).length;

      return {
        id: member.$id,
        name: member.name,
        avatar: member.name.substring(0, 2).toUpperCase(),
        tasks: memberTasks.length,
        completedTasks,
      };
    }).filter(m => m.tasks > 0).slice(0, 4); // Top 4 members

    return memberWorkload;
  }, [tasks, members]);

  // Calculate due alerts from real data
  const dueAlerts = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tasks
      .filter(t => {
        if (!t.dueDate || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CLOSED) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= now && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 6)
      .map(t => ({
        id: t.$id,
        title: t.name,
        dueDate: new Date(t.dueDate),
      }));
  }, [tasks]);

  // Calculate recent tasks
  const recentTasks = useMemo(() => {
    return tasks
      .slice(0, 5)
      .map(task => {
        const member = members.find(m => m.$id === task.assigneeId);
        return {
          id: task.$id,
          title: task.name,
          status: task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CLOSED ? "Done" :
                  task.status === TaskStatus.IN_PROGRESS ? "In Progress" : "To Do",
          assignee: member?.name?.split(' ').map(n => n[0]).join('') + '.' || "N/A",
          priority: task.priority || "Medium",
        };
      });
  }, [tasks, members]);

  return (
    <div className="space-y-3 p-1">
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-xl font-semibold">{analytics.totalTasks}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <ListTodo className="h-4 w-4 text-[#2663ec]" />
            </div>
          </div>
          <div className="mt-2">
            <Progress value={(analytics.completedTasks / analytics.totalTasks) * 100}
              className="h-1 bg-blue-100 [&>div]:bg-[#2663ec]" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-semibold">{analytics.completedTasks}</p>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[11px] text-muted-foreground">
              {Math.round((analytics.completedTasks / analytics.totalTasks) * 100)}% completion rate
            </p>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-xl font-semibold">{analytics.inProgressTasks}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <Clock className="h-4 w-4 text-[#2663ec]" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[11px] text-muted-foreground">
              Active in current sprint
            </p>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Flagged</p>
              <p className="text-xl font-semibold">{analytics.flaggedTasks}</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <Flag className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[11px] text-muted-foreground">
              Needs attention
            </p>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-xl font-semibold">{analytics.overdueTasks}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[11px] text-muted-foreground">
              Past due date
            </p>
          </div>
        </Card>
      </div>

      {/* Top row - Status Overview, Recent Activity, and Due Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Status Overview</h3>
            <BarChart className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          {statusOverview.some(s => s.value > 0) ? (
            <>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={statusOverview.filter(s => s.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                    >
                      {statusOverview.filter(s => s.value > 0).map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {statusOverview.map((status) => (
                  <div key={status.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-[11px] text-muted-foreground">{status.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
              No tasks yet
            </div>
          )}
        </Card>

        {/* Replace Recent Activity with Audit Log Widget */}
        <div className="lg:col-span-2">
          <ProjectActivityLogWidget 
            workspaceId={workspaceId} 
            projectId={projectId}
            limit={6}
          />

          <Card className="p-4 mt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">Due Alerts</h3>
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dueAlerts.length > 0 ? (
                dueAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 bg-secondary/10 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#2663ec]" />
                      <span className="text-xs font-medium">{alert.title}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">
                      Due {formatDistanceToNow(alert.dueDate, { addSuffix: true })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-sm text-center text-muted-foreground py-2">
                  No upcoming due dates
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Middle row - Workload Distribution and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Workload Distribution</h3>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {workloadDistribution.length > 0 ? (
              workloadDistribution.map((member) => {
                const workloadPercentage = analytics.totalTasks > 0 ? (member.tasks / analytics.totalTasks) * 100 : 0;
                return (
                  <div key={member.id} className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#2663ec]/10 text-[#2663ec] flex items-center justify-center text-[11px] font-medium shrink-0">
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium truncate">{member.name}</p>
                          <span className="text-[11px] text-muted-foreground">{member.tasks} tasks</span>
                        </div>
                        <Progress value={workloadPercentage} className="h-1.5 mt-1.5 bg-blue-100 [&>div]:bg-[#2663ec]" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-center text-muted-foreground py-4">
                No assigned tasks yet
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Recent Tasks</h3>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-secondary/10 rounded-md">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 mt-1.5 rounded-full ${
                      task.status === "Done" ? "bg-green-500" :
                      task.status === "In Progress" ? "bg-[#2663ec]" : "bg-gray-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{task.assignee}</span>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                          task.priority === "HIGH" || task.priority === "URGENT" ? "bg-red-100 text-red-700" :
                          task.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-center text-muted-foreground py-4">
                No tasks yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom row - Priority Distribution & Members */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Priority Distribution Chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Priority Distribution</h3>
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={[
                  { 
                    name: "URGENT", 
                    count: tasks.filter(t => t.priority === TaskPriority.URGENT).length,
                    fill: "#ef4444"
                  },
                  { 
                    name: "HIGH", 
                    count: tasks.filter(t => t.priority === TaskPriority.HIGH).length,
                    fill: "#f97316"
                  },
                  { 
                    name: "MEDIUM", 
                    count: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length,
                    fill: "#f59e0b"
                  },
                  { 
                    name: "LOW", 
                    count: tasks.filter(t => t.priority === TaskPriority.LOW).length,
                    fill: "#22c55e"
                  },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  stroke="#888"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  stroke="#888"
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Replace Team Members with Enhanced Widget */}
        <ProjectMembersWidget 
          workspaceId={workspaceId} 
          projectId={projectId}
          limit={12}
        />
      </div>
    </div>
  );
};