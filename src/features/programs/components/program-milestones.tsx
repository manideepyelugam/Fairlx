"use client";

import { useState } from "react";
import {
  Plus,
  Target,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const statusConfig: Record<MilestoneStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  [MilestoneStatus.NOT_STARTED]: {
    label: "Not Started",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10 border-gray-500/20",
    icon: Clock,
  },
  [MilestoneStatus.IN_PROGRESS]: {
    label: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    icon: Target,
  },
  [MilestoneStatus.COMPLETED]: {
    label: "Completed",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  [MilestoneStatus.DELAYED]: {
    label: "Delayed",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    icon: AlertCircle,
  },
};

export const ProgramMilestones = ({
  programId,
  canManage = false,
}: ProgramMilestonesProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProgramMilestone | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: milestonesData, isLoading } = useGetProgramMilestones({ programId });
  const { mutate: createMilestone, isPending: isCreating } = useCreateMilestone();
  const { mutate: updateMilestone, isPending: isUpdating } = useUpdateMilestone();
  const { mutate: deleteMilestone, isPending: isDeleting } = useDeleteMilestone();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Milestone",
    "Are you sure you want to delete this milestone?",
    "destructive"
  );

  const milestones = milestonesData?.data?.documents || [];

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = async (milestoneId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteMilestone({ programId, milestoneId });
  };

  // Calculate stats
  const completedCount = milestones.filter(
    (m: ProgramMilestone) => m.status === MilestoneStatus.COMPLETED
  ).length;
  const totalProgress = milestones.length > 0
    ? Math.round(milestones.reduce((acc: number, m: ProgramMilestone) => acc + (m.progress || 0), 0) / milestones.length)
    : 0;

  if (isLoading) {
    return <MilestonesSkeleton />;
  }

  return (
    <>
      <DeleteDialog />
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Milestones
                <Badge variant="secondary" className="ml-2">
                  {completedCount}/{milestones.length}
                </Badge>
              </CardTitle>
              {milestones.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={totalProgress} className="h-2 w-32" />
                  <span className="text-xs text-muted-foreground">{totalProgress}% complete</span>
                </div>
              )}
            </div>

            {canManage && (
              <CreateMilestoneDialog
                programId={programId}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCreate={createMilestone}
                isCreating={isCreating}
              />
            )}
          </div>
        </CardHeader>

        <CardContent>
          {milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">No milestones yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create milestones to track program progress.
              </p>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Milestone
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone: ProgramMilestone) => (
                <MilestoneCard
                  key={milestone.$id}
                  milestone={milestone}
                  canManage={canManage}
                  isExpanded={expandedIds.has(milestone.$id)}
                  onToggleExpand={() => toggleExpanded(milestone.$id)}
                  onEdit={() => setEditingMilestone(milestone)}
                  onDelete={() => handleDelete(milestone.$id)}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Milestone Dialog */}
      {editingMilestone && (
        <EditMilestoneDialog
          milestone={editingMilestone}
          programId={programId}
          open={!!editingMilestone}
          onOpenChange={(open) => !open && setEditingMilestone(null)}
          onUpdate={updateMilestone}
          isUpdating={isUpdating}
        />
      )}
    </>
  );
};

// Milestone Card
interface MilestoneCardProps {
  milestone: ProgramMilestone;
  canManage: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const MilestoneCard = ({
  milestone,
  canManage,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDeleting,
}: MilestoneCardProps) => {
  const statusInfo = statusConfig[milestone.status as MilestoneStatus] || statusConfig[MilestoneStatus.NOT_STARTED];
  const StatusIcon = statusInfo.icon;

  const isOverdue = milestone.targetDate && isPast(new Date(milestone.targetDate)) && milestone.status !== MilestoneStatus.COMPLETED;
  const daysUntilDue = milestone.targetDate
    ? differenceInDays(new Date(milestone.targetDate), new Date())
    : null;

  return (
    <div className="p-4 rounded-lg border bg-card transition-all group">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusIcon className={cn("h-5 w-5 shrink-0", statusInfo.color)} />
              <h4 className="font-medium truncate">{milestone.name}</h4>
              <Badge
                variant="outline"
                className={cn("text-xs shrink-0", statusInfo.bgColor, statusInfo.color)}
              >
                {statusInfo.label}
              </Badge>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3 flex items-center gap-3">
            <Progress value={milestone.progress || 0} className="h-2 flex-1" />
            <span className="text-sm font-medium w-12 text-right">
              {milestone.progress || 0}%
            </span>
          </div>

          {/* Date info */}
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            {milestone.targetDate && (
              <div className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(milestone.targetDate), "MMM d, yyyy")}
                  {daysUntilDue !== null && !isOverdue && daysUntilDue <= 7 && (
                    <span className="ml-1 text-amber-500">({daysUntilDue} days left)</span>
                  )}
                  {isOverdue && (
                    <span className="ml-1 text-red-500">Overdue</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Expandable description */}
          {milestone.description && (
            <div className="mt-2">
              <button
                onClick={onToggleExpand}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show details
                  </>
                )}
              </button>
              {isExpanded && (
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {milestone.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Milestone Dialog
interface CreateMilestoneDialogProps {
  programId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { programId: string; name: string; description?: string; targetDate?: string; status?: MilestoneStatus }) => void;
  isCreating: boolean;
}

const CreateMilestoneDialog = ({
  programId,
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: CreateMilestoneDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<MilestoneStatus>(MilestoneStatus.NOT_STARTED);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(
      {
        programId,
        name,
        description: description || undefined,
        targetDate: targetDate || undefined,
        status,
      },
      // @ts-expect-error - callbacks work
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setTargetDate("");
          setStatus(MilestoneStatus.NOT_STARTED);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Milestone</DialogTitle>
            <DialogDescription>
              Add a new milestone to track program progress.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter milestone name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as MilestoneStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Milestone Dialog
interface EditMilestoneDialogProps {
  milestone: ProgramMilestone;
  programId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: { programId: string; milestoneId: string; name?: string; description?: string | null; targetDate?: string | null; status?: MilestoneStatus; progress?: number }) => void;
  isUpdating: boolean;
}

const EditMilestoneDialog = ({
  milestone,
  programId,
  open,
  onOpenChange,
  onUpdate,
  isUpdating,
}: EditMilestoneDialogProps) => {
  const [name, setName] = useState(milestone.name);
  const [description, setDescription] = useState(milestone.description || "");
  const [targetDate, setTargetDate] = useState(
    milestone.targetDate ? format(new Date(milestone.targetDate), "yyyy-MM-dd") : ""
  );
  const [status, setStatus] = useState<MilestoneStatus>(milestone.status as MilestoneStatus);
  const [progress, setProgress] = useState(milestone.progress || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(
      {
        programId,
        milestoneId: milestone.$id,
        name,
        description: description || null,
        targetDate: targetDate || null,
        status,
        progress,
      },
      // @ts-expect-error - callbacks work
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>
              Update milestone details and progress.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter milestone name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-targetDate">Target Date</Label>
                <Input
                  id="edit-targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as MilestoneStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-progress">Progress: {progress}%</Label>
              <Input
                id="edit-progress"
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !name.trim()}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Loading skeleton
const MilestonesSkeleton = () => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </CardContent>
  </Card>
);
