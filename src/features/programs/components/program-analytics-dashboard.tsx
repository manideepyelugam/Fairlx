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
  ShieldAlert,
  Activity,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useGetProgramAnalytics } from "../api/use-get-program-analytics";

interface ProgramAnalyticsDashboardProps {
  programId: string;
}

export const ProgramAnalyticsDashboard = ({ programId }: ProgramAnalyticsDashboardProps) => {
  const { data: analyticsData, isLoading } = useGetProgramAnalytics({ programId });

  if (isLoading) return <AnalyticsSkeleton />;

  const analytics = analyticsData?.data;

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Activity className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Unable to load analytics</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">Analytics data could not be retrieved. Try refreshing the page.</p>
      </div>
    );
  }

  // Empty state when there are no projects linked yet
  if (analytics.totalProjects === 0 && analytics.totalTasks === 0 && analytics.totalMilestones === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <BarChart3 className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No data to analyze</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">Link projects and create milestones to start seeing analytics insights here.</p>
      </div>
    );
  }

  const taskRate = analytics.totalTasks > 0 ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0;
  const msRate = analytics.totalMilestones > 0 ? Math.round((analytics.completedMilestones / analytics.totalMilestones) * 100) : 0;
  const projectRate = analytics.totalProjects > 0 ? Math.round((analytics.completedProjects / analytics.totalProjects) * 100) : 0;

  const hasAlerts = analytics.overdueTasks > 0 || analytics.blockedTasks > 0;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={TrendingUp} label="Overall Progress" value={`${analytics.overallProgress}%`} accent="blue" sub={<Progress value={analytics.overallProgress} className="h-1.5 mt-2" />} />
        <KpiCard icon={FolderKanban} label="Projects" value={analytics.totalProjects} accent="violet" sub={<span className="text-xs text-muted-foreground">{analytics.activeProjects} active &middot; {analytics.completedProjects} done</span>} />
        <KpiCard icon={Users} label="Members" value={analytics.totalMembers} accent="emerald" />
        <KpiCard icon={Target} label="Milestones" value={`${analytics.completedMilestones}/${analytics.totalMilestones}`} accent="amber" sub={<span className="text-xs text-muted-foreground">{msRate}% complete</span>} />
      </div>

      {/* Task Breakdown */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Task Breakdown</h3>
            <span className="text-xs text-muted-foreground ml-auto">across all linked projects</span>
          </div>

          {/* Stacked Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Task Completion</span>
              <span className="font-bold tabular-nums">{taskRate}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
              {analytics.totalTasks > 0 && (
                <>
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(analytics.completedTasks / analytics.totalTasks) * 100}%` }} />
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(analytics.inProgressTasks / analytics.totalTasks) * 100}%` }} />
                  <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(analytics.blockedTasks / analytics.totalTasks) * 100}%` }} />
                  <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(analytics.overdueTasks / analytics.totalTasks) * 100}%` }} />
                </>
              )}
            </div>

            {/* Legend + Counts */}
            <div className="grid grid-cols-5 gap-3">
              <StatPill color="bg-slate-500" label="Total" value={analytics.totalTasks} />
              <StatPill color="bg-emerald-500" label="Done" value={analytics.completedTasks} pct={taskRate} />
              <StatPill color="bg-blue-500" label="Active" value={analytics.inProgressTasks} pct={analytics.totalTasks > 0 ? Math.round((analytics.inProgressTasks / analytics.totalTasks) * 100) : 0} />
              <StatPill color="bg-red-500" label="Blocked" value={analytics.blockedTasks} pct={analytics.totalTasks > 0 ? Math.round((analytics.blockedTasks / analytics.totalTasks) * 100) : 0} />
              <StatPill color="bg-amber-400" label="Overdue" value={analytics.overdueTasks} alert={analytics.overdueTasks > 0} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Alerts + Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alerts */}
        <Card className={cn(hasAlerts && "border-amber-200 dark:border-amber-800/50")}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className={cn("h-5 w-5", hasAlerts ? "text-amber-500" : "text-muted-foreground")} />
              <h3 className="font-semibold">Health Check</h3>
            </div>
            <div className="space-y-2">
              {analytics.overdueTasks > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-red-500" /><span className="font-medium">Overdue Tasks</span></div>
                  <Badge variant="destructive" className="tabular-nums">{analytics.overdueTasks}</Badge>
                </div>
              )}
              {analytics.blockedTasks > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2 text-sm"><AlertCircle className="h-4 w-4 text-amber-500" /><span className="font-medium">Blocked Tasks</span></div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600 tabular-nums">{analytics.blockedTasks}</Badge>
                </div>
              )}
              {!hasAlerts && (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-emerald-600">All Clear</p>
                  <p className="text-xs text-muted-foreground mt-1">No issues requiring attention</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Completion Summary</h3>
            </div>
            <div className="space-y-4">
              <SummaryRow label="Tasks" done={analytics.completedTasks} total={analytics.totalTasks} pct={taskRate} />
              <Separator />
              <SummaryRow label="Milestones" done={analytics.completedMilestones} total={analytics.totalMilestones} pct={msRate} />
              <Separator />
              <SummaryRow label="Projects" done={analytics.completedProjects} total={analytics.totalProjects} pct={projectRate} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────────────────── */

const ACCENT: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function KpiCard({ icon: Icon, label, value, accent, sub }: { icon: typeof TrendingUp; label: string; value: string | number; accent: string; sub?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {sub && <div className="mt-1.5">{sub}</div>}
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", ACCENT[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatPill({ color, label, value, pct, alert }: { color: string; label: string; value: number; pct?: number; alert?: boolean }) {
  return (
    <div className="p-3 rounded-lg border bg-card/50 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {alert && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5 leading-none">!</Badge>}
      </div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      {pct !== undefined && <p className="text-[11px] text-muted-foreground tabular-nums">{pct}%</p>}
    </div>
  );
}

function SummaryRow({ label, done, total, pct }: { label: string; done: number; total: number; pct: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{done}/{total}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 tabular-nums">{pct}%</Badge>
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────── */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <Skeleton className="h-52 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-44 rounded-xl" /><Skeleton className="h-44 rounded-xl" /></div>
    </div>
  );
}
