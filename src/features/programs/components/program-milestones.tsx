"use client";

import { useState } from "react";
import {
  Plus,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  Loader2,
  Flag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

import { useConfirm } from "@/hooks/use-confirm";
import { useGetProgramMilestones } from "../api/use-get-program-milestones";
import { useCreateMilestone } from "../api/use-create-milestone";
import { useUpdateMilestone } from "../api/use-update-milestone";
import { useDeleteMilestone } from "../api/use-delete-milestone";
import { ProgramMilestone, MilestoneStatus } from "../types";

interface ProgramMilestonesProps {
  programId: string;
  canManage?: boolean;
}

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; dot: string; icon: typeof CheckCircle2 }> = {
  [MilestoneStatus.NOT_STARTED]: { label: "Not Started", color: "text-slate-500", dot: "bg-slate-400", icon: Clock },
  [MilestoneStatus.IN_PROGRESS]: { label: "In Progress", color: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500", icon: Target },
  [MilestoneStatus.COMPLETED]: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", icon: CheckCircle2 },
  [MilestoneStatus.DELAYED]: { label: "Delayed", color: "text-red-600 dark:text-red-400", dot: "bg-red-500", icon: AlertCircle },
};

export const ProgramMilestones = ({ programId, canManage = false }: ProgramMilestonesProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMs, setEditingMs] = useState<ProgramMilestone | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: msData, isLoading } = useGetProgramMilestones({ programId });
  const { mutate: createMs, isPending: isCreating } = useCreateMilestone();
  const { mutate: updateMs, isPending: isUpdating } = useUpdateMilestone();
  const { mutate: deleteMs, isPending: isDel } = useDeleteMilestone();

  const [DelDialog, confirmDel] = useConfirm("Delete Milestone", "Are you sure? This cannot be undone.", "destructive");

  const milestones = msData?.data?.documents || [];
  const completed = milestones.filter((m: ProgramMilestone) => m.status === MilestoneStatus.COMPLETED).length;
  const totalProg = milestones.length > 0 ? Math.round(milestones.reduce((a: number, m: ProgramMilestone) => a + (m.progress || 0), 0) / milestones.length) : 0;

  const toggle = (id: string) => setExpandedIds((p) => { const s = new Set(p); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; });
  const handleDel = async (id: string) => { const ok = await confirmDel(); if (ok) deleteMs({ programId, milestoneId: id }); };

  if (isLoading) return <RoadmapSkeleton />;

  return (
    <>
      <DelDialog />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Program Roadmap
            </h2>
            <p className="text-sm text-muted-foreground">
              {milestones.length > 0
                ? `${completed} of ${milestones.length} milestones completed — ${totalProg}% overall`
                : "Define milestones to track your program journey"}
            </p>
          </div>
          {canManage && (
            <CreateMilestoneDialog
              programId={programId}
              open={createOpen}
              onOpenChange={setCreateOpen}
              onCreate={(data, callbacks) => createMs(data, callbacks)}
              isCreating={isCreating}
            />
          )}
        </div>

        {/* Progress overview */}
        {milestones.length > 0 && (
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Roadmap Progress</span>
                    <span className="text-sm font-bold tabular-nums">{totalProg}%</span>
                  </div>
                  <Progress value={totalProg} className="h-2" />
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center px-3">
                  <p className="text-2xl font-bold text-emerald-600">{completed}</p>
                  <p className="text-[11px] text-muted-foreground">Done</p>
                </div>
                <div className="text-center px-3">
                  <p className="text-2xl font-bold">{milestones.length - completed}</p>
                  <p className="text-[11px] text-muted-foreground">Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roadmap Timeline */}
        {milestones.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted mb-4">
                <Flag className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No milestones yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Create milestones to build a visual roadmap of your program&apos;s journey.
              </p>
              {canManage && (
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Milestone
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-0">
              {milestones.map((ms: ProgramMilestone, _idx: number) => {
                const isComplete = ms.status === MilestoneStatus.COMPLETED;
                const stCfg = STATUS_CONFIG[ms.status as MilestoneStatus] || STATUS_CONFIG[MilestoneStatus.NOT_STARTED];
                const isOverdue = ms.targetDate && isPast(new Date(ms.targetDate)) && !isComplete;
                const daysLeft = ms.targetDate ? differenceInDays(new Date(ms.targetDate), new Date()) : null;
                const expanded = expandedIds.has(ms.$id);

                return (
                  <div key={ms.$id} className="relative flex gap-4 pb-6 last:pb-0 group">
                    {/* Flag Node */}
                    <div className="relative z-10 flex flex-col items-center">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "flex items-center justify-center h-12 w-12 rounded-xl border-2 shadow-sm transition-all",
                              isComplete
                                ? "bg-amber-50 border-amber-400 dark:bg-amber-500/20 dark:border-amber-500"
                                : ms.status === MilestoneStatus.IN_PROGRESS
                                  ? "bg-blue-50 border-blue-400 dark:bg-blue-500/20 dark:border-blue-500"
                                  : ms.status === MilestoneStatus.DELAYED
                                    ? "bg-red-50 border-red-400 dark:bg-red-500/20 dark:border-red-500"
                                    : "bg-emerald-50 border-emerald-400 dark:bg-emerald-500/20 dark:border-emerald-500"
                            )}>
                              <Flag className={cn(
                                "h-5 w-5",
                                isComplete
                                  ? "text-amber-500 fill-amber-500"
                                  : ms.status === MilestoneStatus.IN_PROGRESS
                                    ? "text-blue-500"
                                    : ms.status === MilestoneStatus.DELAYED
                                      ? "text-red-500"
                                      : "text-emerald-500"
                              )} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            {isComplete ? "Completed" : stCfg.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Milestone Content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <Card className={cn("transition-all", isComplete && "opacity-80", "hover:shadow-sm")}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={cn("font-semibold text-[15px]", isComplete && "line-through text-muted-foreground")}>{ms.name}</h4>
                                <Badge variant="outline" className={cn("text-[11px] px-1.5 py-0", stCfg.color)}>
                                  <div className={cn("h-1.5 w-1.5 rounded-full mr-1", stCfg.dot)} />{stCfg.label}
                                </Badge>
                                {isOverdue && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Overdue</Badge>}
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                <Progress value={ms.progress || 0} className="h-1.5 flex-1" />
                                <span className="text-xs font-semibold tabular-nums w-10 text-right">{ms.progress || 0}%</span>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {ms.targetDate && (
                                  <div className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(ms.targetDate), "MMM d, yyyy")}
                                    {daysLeft !== null && !isOverdue && daysLeft >= 0 && daysLeft <= 14 && (
                                      <span className="text-amber-500 ml-1">({daysLeft}d left)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {ms.description && (
                                <div className="mt-2">
                                  <button onClick={() => toggle(ms.$id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    {expanded ? "Hide details" : "Show details"}
                                  </button>
                                  {expanded && (
                                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-muted pl-3">{ms.description}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            {canManage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingMs(ms)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDel(ms.$id)} className="text-destructive" disabled={isDel}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-emerald-500" /><span>Upcoming</span></div>
              <div className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-blue-500" /><span>In Progress</span></div>
              <div className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /><span>Completed</span></div>
              <div className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-red-500" /><span>Delayed</span></div>
            </div>
          </div>
        )}
      </div>

      {editingMs && (
        <EditMilestoneDialog milestone={editingMs} programId={programId} open={!!editingMs} onOpenChange={(o) => !o && setEditingMs(null)} onUpdate={(data, callbacks) => updateMs(data, callbacks)} isUpdating={isUpdating} />
      )}
    </>
  );
};

/* ─── Create Dialog ───────────────────────────────────────────────── */
function CreateMilestoneDialog({ programId, open, onOpenChange, onCreate, isCreating }: {
  programId: string; open: boolean; onOpenChange: (o: boolean) => void;
  onCreate: (d: { programId: string; name: string; description?: string; targetDate?: string; status?: MilestoneStatus }, callbacks?: { onSuccess?: () => void }) => void;
  isCreating: boolean;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<MilestoneStatus>(MilestoneStatus.NOT_STARTED);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(
      { programId, name, description: desc || undefined, targetDate: date || undefined, status },
      { onSuccess: () => { setName(""); setDesc(""); setDate(""); setStatus(MilestoneStatus.NOT_STARTED); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Milestone</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>Create Milestone</DialogTitle><DialogDescription>Add a new milestone to the program roadmap.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="ms-name">Name</Label><Input id="ms-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Beta Launch" required /></div>
            <div className="space-y-2"><Label htmlFor="ms-desc">Description</Label><Textarea id="ms-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional details..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="ms-date">Target Date</Label><Input id="ms-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(v) => setStatus(v as MilestoneStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>{isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Edit Dialog ─────────────────────────────────────────────────── */
function EditMilestoneDialog({ milestone, programId, open, onOpenChange, onUpdate, isUpdating }: {
  milestone: ProgramMilestone; programId: string; open: boolean; onOpenChange: (o: boolean) => void;
  onUpdate: (d: { programId: string; milestoneId: string; name?: string; description?: string | null; targetDate?: string | null; status?: MilestoneStatus; progress?: number }, callbacks?: { onSuccess?: () => void }) => void;
  isUpdating: boolean;
}) {
  const [name, setName] = useState(milestone.name);
  const [desc, setDesc] = useState(milestone.description || "");
  const [date, setDate] = useState(milestone.targetDate ? format(new Date(milestone.targetDate), "yyyy-MM-dd") : "");
  const [status, setStatus] = useState<MilestoneStatus>(milestone.status as MilestoneStatus);
  const [progress, setProgress] = useState(milestone.progress || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(
      { programId, milestoneId: milestone.$id, name, description: desc || null, targetDate: date || null, status, progress },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>Edit Milestone</DialogTitle><DialogDescription>Update milestone details and progress.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Target Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(v) => setStatus(v as MilestoneStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Progress</Label><span className="text-sm font-semibold tabular-nums">{progress}%</span></div>
              <Input type="range" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="cursor-pointer" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isUpdating || !name.trim()}>{isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────── */
function RoadmapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><Skeleton className="h-6 w-48" /><Skeleton className="h-9 w-32" /></div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-muted" />
        {[1, 2, 3].map((i) => (<div key={i} className="flex gap-4 pb-6"><Skeleton className="h-12 w-12 rounded-xl shrink-0" /><Skeleton className="h-28 flex-1 rounded-lg" /></div>))}
      </div>
    </div>
  );
}
