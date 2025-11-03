"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertCircle,
  Zap,
  Bug,
  CheckSquare,
  TrendingUp,
  Users,
  Layers,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "../types";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";

// Mock data for the dashboard
const mockData = {
  members: [
    { id: "member-1", name: "John Doe", avatar: "JD", role: "Lead Developer", tasks: 12 },
    { id: "member-2", name: "Sarah Smith", avatar: "SS", role: "UI Designer", tasks: 8 },
    { id: "member-3", name: "Mike Johnson", avatar: "MJ", role: "Backend Dev", tasks: 15 },
    { id: "member-4", name: "Emma Wilson", avatar: "EW", role: "Product Manager", tasks: 6 },
  ],
  statusOverview: [
    { id: "status-1", name: "Done", value: 48, color: "#2663ec" },
    { id: "status-2", name: "In Progress", value: 12, color: "#3b82f6" },
    { id: "status-3", name: "To Do", value: 24, color: "#93c5fd" },
  ],
  epicProgress: [
    { id: "epic-1", name: "Auth System", progress: 85 },
    { id: "epic-2", name: "Dashboard", progress: 60 },
    { id: "epic-3", name: "API Integration", progress: 45 },
    { id: "epic-4", name: "Mobile App", progress: 30 },
    { id: "epic-5", name: "Payment System", progress: 72 },
  ],
  teamWorkload: [
    { id: "workload-1", name: "John Doe", tasksCompleted: 24, tasksTotal: 28 },
    { id: "workload-2", name: "Sarah Smith", tasksCompleted: 18, tasksTotal: 22 },
    { id: "workload-3", name: "Mike Johnson", tasksCompleted: 32, tasksTotal: 35 },
    { id: "workload-4", name: "Emma Wilson", tasksCompleted: 15, tasksTotal: 20 },
  ],
  typesOfWork: [
    { id: "type-1", name: "Subtask", count: 36, total: 100, icon: CheckSquare },
    { id: "type-2", name: "Epic", count: 27, total: 100, icon: Zap },
    { id: "type-3", name: "Feature", count: 27, total: 100, icon: Bug },
  ],
  dueAlerts: [
    { id: "due-1", title: "API Documentation", dueDate: new Date(2025, 10, 5) },
    { id: "due-2", title: "User Testing", dueDate: new Date(2025, 10, 7) },
    { id: "due-3", title: "Security Review", dueDate: new Date(2025, 10, 10) },
  ],
  recentActivity: [
    {
      id: "activity-1",
      type: "task",
      action: "completed",
      title: "Update user authentication",
      user: "John Doe",
      timestamp: new Date(2025, 10, 3, 14, 30)
    },
    {
      id: "activity-2",
      type: "epic",
      action: "created",
      title: "Mobile App Development",
      user: "Sarah Smith",
      timestamp: new Date(2025, 10, 3, 13, 15)
    },
    {
      id: "activity-3",
      type: "task",
      action: "updated",
      title: "Fix navigation bug",
      user: "Mike Johnson",
      timestamp: new Date(2025, 10, 3, 12, 45)
    }
  ]
};

interface DataDashboardProps {
  tasks?: any[];
  isLoading?: boolean;
}

export const DataDashboard = ({ tasks, isLoading }: DataDashboardProps) => {
  // We'll use mock data for now, but in real implementation we'll calculate these from tasks

  // Calculate analytics totals
  const analytics = {
    totalTasks: mockData.teamWorkload.reduce((acc, member) => acc + member.tasksTotal, 0),
    completedTasks: mockData.teamWorkload.reduce((acc, member) => acc + member.tasksCompleted, 0),
    inProgressTasks: mockData.statusOverview.find(s => s.name === "In Progress")?.value || 0,
    blockedTasks: 5, // This would come from real data
    overdueTasks: 3, // This would come from real data
  };

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
              <p className="text-xs text-muted-foreground">Blocked</p>
              <p className="text-xl font-semibold">{analytics.blockedTasks}</p>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <AlertCircle className="h-4 w-4 text-red-500" />
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
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={mockData.statusOverview}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                >
                  {mockData.statusOverview.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {mockData.statusOverview.map((status) => (
              <div key={status.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-[11px] text-muted-foreground">{status.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Recent Activity</h3>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mockData.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-2 bg-secondary/10 rounded-md"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium">{activity.title}</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.action}</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">Due Alerts</h3>
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mockData.dueAlerts.map((alert) => (
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
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Middle row - Workload Distribution and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Workload Distribution</h3>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {mockData.members.map((member) => {
              const workloadPercentage = (member.tasks / analytics.totalTasks) * 100;
              return (
                <div key={member.id} className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#2663ec]/10 text-[#2663ec] flex items-center justify-center text-[11px] font-medium shrink-0">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium truncate">{member.name}</p>
                        <span className="text-[11px] text-muted-foreground">{Math.round(workloadPercentage)}%</span>
                      </div>
                      <Progress value={workloadPercentage} className="h-1.5 mt-1.5 bg-blue-100 [&>div]:bg-[#2663ec]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Recent Tasks</h3>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {[
              { id: 1, title: "Update API documentation", status: "In Progress", assignee: "John D.", priority: "High" },
              { id: 2, title: "Fix navigation bug", status: "Done", assignee: "Sarah S.", priority: "Medium" },
              { id: 3, title: "Implement auth flow", status: "In Progress", assignee: "Mike J.", priority: "High" },
              { id: 4, title: "Design review meeting", status: "To Do", assignee: "Emma W.", priority: "Low" },
              { id: 5, title: "Mobile app testing", status: "Done", assignee: "John D.", priority: "Medium" }
            ].map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-secondary/10 rounded-md">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 mt-1.5 rounded-full ${task.status === "Done" ? "bg-green-500" :
                      task.status === "In Progress" ? "bg-[#2663ec]" : "bg-gray-400"
                    }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{task.assignee}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${task.priority === "High" ? "bg-red-100 text-red-700" :
                          task.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                        }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row - Epic Progress and Types of Work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Epic Progress</h3>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {mockData.epicProgress.map((epic) => (
              <div key={epic.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{epic.name}</span>
                  <span className="text-muted-foreground">{epic.progress}%</span>
                </div>
                <Progress value={epic.progress} className="h-1.5 bg-blue-100 [&>div]:bg-[#2663ec]" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground">Types of Work</h3>
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {mockData.typesOfWork.map((type) => (
              <div key={type.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <type.icon className="h-3.5 w-3.5 text-[#2663ec]" />
                    <span className="text-xs">{type.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{type.count}%</span>
                </div>
                <Progress value={type.count} className="h-1.5 bg-blue-100 [&>div]:bg-[#2663ec]" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row - Types of Work */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-muted-foreground">Types of Work</h3>
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mockData.typesOfWork.map((type) => (
            <div key={type.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <type.icon className="h-3.5 w-3.5 text-[#2663ec]" />
                  <span className="text-xs">{type.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{type.count}%</span>
              </div>
              <Progress value={type.count} className="h-1.5 bg-blue-100 [&>div]:bg-[#2663ec]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};