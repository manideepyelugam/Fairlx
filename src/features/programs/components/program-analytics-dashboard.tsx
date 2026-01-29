"use client";

import {
  BarChart3,
  Target,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  FolderKanban,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetProgramAnalytics } from "../api/use-get-program-analytics";

interface ProgramAnalyticsDashboardProps {
  programId: string;
}

export const ProgramAnalyticsDashboard = ({
  programId,
}: ProgramAnalyticsDashboardProps) => {
  const { data: analyticsData, isLoading } = useGetProgramAnalytics({ programId });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const analytics = analyticsData?.data;

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Unable to load analytics</p>
      </div>
    );
  }

  const taskCompletionRate = analytics.totalTasks > 0
    ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
    : 0;

  const milestoneCompletionRate = analytics.totalMilestones > 0
    ? Math.round((analytics.completedMilestones / analytics.totalMilestones) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Overall Progress"
          value={`${analytics.overallProgress}%`}
          icon={TrendingUp}
          trend={analytics.overallProgress >= 50 ? "up" : analytics.overallProgress > 0 ? "neutral" : "down"}
          color="blue"
        >
          <Progress value={analytics.overallProgress} className="h-2 mt-2" />
        </StatCard>

        <StatCard
          title="Projects"
          value={analytics.totalProjects}
          icon={FolderKanban}
          description={`${analytics.activeProjects} active, ${analytics.completedProjects} completed`}
          color="purple"
        />

        <StatCard
          title="Members"
          value={analytics.totalMembers}
          icon={Users}
          color="green"
        />

        <StatCard
          title="Milestones"
          value={`${analytics.completedMilestones}/${analytics.totalMilestones}`}
          icon={Target}
          description={`${milestoneCompletionRate}% complete`}
          color="amber"
        />
      </div>

      {/* Task Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task Breakdown
          </CardTitle>
          <CardDescription>
            Overview of tasks across all linked projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <TaskStatItem
              label="Total"
              value={analytics.totalTasks}
              color="bg-slate-500"
            />
            <TaskStatItem
              label="Completed"
              value={analytics.completedTasks}
              color="bg-emerald-500"
              percentage={taskCompletionRate}
            />
            <TaskStatItem
              label="In Progress"
              value={analytics.inProgressTasks}
              color="bg-blue-500"
              percentage={analytics.totalTasks > 0 ? Math.round((analytics.inProgressTasks / analytics.totalTasks) * 100) : 0}
            />
            <TaskStatItem
              label="Blocked"
              value={analytics.blockedTasks}
              color="bg-red-500"
              percentage={analytics.totalTasks > 0 ? Math.round((analytics.blockedTasks / analytics.totalTasks) * 100) : 0}
            />
            <TaskStatItem
              label="Overdue"
              value={analytics.overdueTasks}
              color="bg-amber-500"
              isAlert={analytics.overdueTasks > 0}
            />
          </div>

          {/* Task Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Task Completion</span>
              <span className="font-medium">{taskCompletionRate}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
              {analytics.totalTasks > 0 && (
                <>
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(analytics.completedTasks / analytics.totalTasks) * 100}%` }}
                  />
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(analytics.inProgressTasks / analytics.totalTasks) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(analytics.blockedTasks / analytics.totalTasks) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Blocked</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground">Other</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.overdueTasks > 0 && (
                <AlertItem
                  icon={Clock}
                  label="Overdue Tasks"
                  value={analytics.overdueTasks}
                  severity="high"
                />
              )}
              {analytics.blockedTasks > 0 && (
                <AlertItem
                  icon={AlertCircle}
                  label="Blocked Tasks"
                  value={analytics.blockedTasks}
                  severity="medium"
                />
              )}
              {analytics.overdueTasks === 0 && analytics.blockedTasks === 0 && (
                <div className="flex items-center gap-2 py-4 text-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-muted-foreground">No issues requiring attention</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ProgressItem
                label="Tasks"
                completed={analytics.completedTasks}
                total={analytics.totalTasks}
              />
              <ProgressItem
                label="Milestones"
                completed={analytics.completedMilestones}
                total={analytics.totalMilestones}
              />
              <ProgressItem
                label="Projects"
                completed={analytics.completedProjects}
                total={analytics.totalProjects}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof BarChart3;
  description?: string;
  trend?: "up" | "down" | "neutral";
  color: "blue" | "purple" | "green" | "amber" | "red";
  children?: React.ReactNode;
}

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-500",
  purple: "bg-purple-500/10 text-purple-500",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  red: "bg-red-500/10 text-red-500",
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color,
  children,
}: StatCardProps) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <>
                {trend === "up" && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                {trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                {trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
              </>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </CardContent>
  </Card>
);

// Task Stat Item
interface TaskStatItemProps {
  label: string;
  value: number;
  color: string;
  percentage?: number;
  isAlert?: boolean;
}

const TaskStatItem = ({ label, value, color, percentage, isAlert }: TaskStatItemProps) => (
  <div className="p-3 rounded-lg border bg-card">
    <div className="flex items-center gap-2 mb-1">
      <div className={cn("h-3 w-3 rounded-full", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
      {isAlert && value > 0 && (
        <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
          Alert
        </Badge>
      )}
    </div>
    <p className="text-xl font-bold">{value}</p>
    {percentage !== undefined && (
      <p className="text-xs text-muted-foreground">{percentage}%</p>
    )}
  </div>
);

// Alert Item
interface AlertItemProps {
  icon: typeof Clock;
  label: string;
  value: number;
  severity: "high" | "medium" | "low";
}

const AlertItem = ({ icon: Icon, label, value, severity }: AlertItemProps) => {
  const severityColors = {
    high: "bg-red-500/10 text-red-600 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  return (
    <div className={cn("flex items-center justify-between p-3 rounded-lg border", severityColors[severity])}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="font-medium">{label}</span>
      </div>
      <Badge variant="secondary" className="font-bold">
        {value}
      </Badge>
    </div>
  );
};

// Progress Item
interface ProgressItemProps {
  label: string;
  completed: number;
  total: number;
}

const ProgressItem = ({ label, completed, total }: ProgressItemProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{completed}/{total}</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
      </div>
    </div>
  );
};

// Loading Skeleton
const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  </div>
);
