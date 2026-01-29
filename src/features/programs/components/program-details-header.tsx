"use client";

import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Users,
  Calendar,
  Target,
  Settings,
  ArrowLeft,
  Pencil,
  Trash2,
  MoreHorizontal,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useConfirm } from "@/hooks/use-confirm";
import { useEditProgramModal } from "../hooks/use-edit-program-modal";
import { useDeleteProgram } from "../api/use-delete-program";
import { useGetProgram } from "../api/use-get-program";
import { useGetProgramSummary } from "../api/use-get-program-summary";
import { ProgramStatus, ProgramPriority } from "../types";

interface ProgramDetailsHeaderProps {
  programId: string;
  workspaceId: string;
}

const statusConfig: Record<ProgramStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  [ProgramStatus.PLANNING]: {
    label: "Planning",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10 border-gray-500/20",
    icon: Clock,
  },
  [ProgramStatus.ACTIVE]: {
    label: "Active",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    icon: BarChart3,
  },
  [ProgramStatus.ON_HOLD]: {
    label: "On Hold",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    icon: AlertCircle,
  },
  [ProgramStatus.COMPLETED]: {
    label: "Completed",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  [ProgramStatus.CANCELLED]: {
    label: "Cancelled",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    icon: AlertCircle,
  },
};

const priorityConfig: Record<ProgramPriority, { label: string; color: string }> = {
  [ProgramPriority.LOW]: { label: "Low", color: "text-gray-500 bg-gray-500/10 border-gray-500/20" },
  [ProgramPriority.MEDIUM]: { label: "Medium", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  [ProgramPriority.HIGH]: { label: "High", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  [ProgramPriority.CRITICAL]: { label: "Critical", color: "text-red-500 bg-red-500/10 border-red-500/20" },
};

export const ProgramDetailsHeader = ({
  programId,
  workspaceId,
}: ProgramDetailsHeaderProps) => {
  const router = useRouter();
  const { open: openEditModal } = useEditProgramModal();
  const { mutate: deleteProgram, isPending: isDeleting } = useDeleteProgram();

  const { data: program, isLoading: isProgramLoading } = useGetProgram({ programId });
  const { data: summary } = useGetProgramSummary({ programId });

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Program",
    `Are you sure you want to delete this program? All linked projects will be unlinked. This action cannot be undone.`,
    "destructive"
  );

  const handleBack = () => {
    router.push(`/workspaces/${workspaceId}/programs`);
  };

  const handleEdit = () => {
    openEditModal(programId);
  };

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;

    deleteProgram(
      { param: { programId } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${workspaceId}/programs`);
        },
      }
    );
  };

  if (isProgramLoading) {
    return <ProgramDetailsHeaderSkeleton />;
  }

  if (!program) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Program not found</p>
      </div>
    );
  }

  const statusInfo = statusConfig[program.status as ProgramStatus] || statusConfig[ProgramStatus.PLANNING];
  const StatusIcon = statusInfo.icon;
  const priorityInfo = program.priority 
    ? priorityConfig[program.priority as ProgramPriority] 
    : null;

  // Calculate time info
  const getTimeInfo = () => {
    if (!program.endDate) return null;
    const endDate = new Date(program.endDate);
    
    if (program.status === ProgramStatus.COMPLETED) {
      return { text: "Completed", variant: "success" as const };
    }
    
    if (isPast(endDate)) {
      const daysOverdue = differenceInDays(new Date(), endDate);
      return { text: `${daysOverdue} days overdue`, variant: "destructive" as const };
    }
    
    const daysRemaining = differenceInDays(endDate, new Date());
    if (daysRemaining <= 7) {
      return { text: `${daysRemaining} days remaining`, variant: "warning" as const };
    }
    
    return { text: `${daysRemaining} days remaining`, variant: "default" as const };
  };

  const timeInfo = getTimeInfo();
  const progress = (program as unknown as { progress?: number }).progress || 0;

  return (
    <>
      <DeleteDialog />
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left side - Program info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                {/* Program icon */}
                <div
                  className={cn(
                    "h-16 w-16 rounded-xl flex items-center justify-center shrink-0",
                    "border shadow-sm",
                    program.color ? undefined : "bg-primary/10"
                  )}
                  style={program.color ? { backgroundColor: `${program.color}15`, borderColor: `${program.color}40` } : undefined}
                >
                  <FolderKanban 
                    className="h-8 w-8"
                    style={program.color ? { color: program.color } : undefined}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold truncate">{program.name}</h1>
                    <Badge variant="outline" className={cn(statusInfo.bgColor, statusInfo.color)}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                    {priorityInfo && (
                      <Badge variant="outline" className={priorityInfo.color}>
                        {priorityInfo.label} Priority
                      </Badge>
                    )}
                  </div>

                  {program.description && (
                    <p className="mt-2 text-muted-foreground line-clamp-2">
                      {program.description}
                    </p>
                  )}

                  {/* Meta info row */}
                  <div className="flex items-center gap-4 mt-4 flex-wrap text-sm">
                    {program.programLead && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {program.programLead.profileImageUrl && (
                                  <AvatarImage src={program.programLead.profileImageUrl} />
                                )}
                                <AvatarFallback className="text-xs">
                                  {program.programLead.name?.[0]?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-muted-foreground">
                                {program.programLead.name}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Program Lead</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {(program.startDate || program.endDate) && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {program.startDate && format(new Date(program.startDate), "MMM d, yyyy")}
                        {program.startDate && program.endDate && " → "}
                        {program.endDate && format(new Date(program.endDate), "MMM d, yyyy")}
                      </div>
                    )}

                    {timeInfo && (
                      <Badge
                        variant={timeInfo.variant === "destructive" ? "destructive" : "outline"}
                        className={cn(
                          timeInfo.variant === "warning" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          timeInfo.variant === "success" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        {timeInfo.text}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/workspaces/${workspaceId}/programs/${programId}/settings`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Program
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Progress and stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Progress */}
            <div className="col-span-2 md:col-span-1 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-lg font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Projects */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary?.data?.projectCount ?? (program as unknown as { projectCount?: number }).projectCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary?.data?.memberCount ?? (program as unknown as { memberCount?: number }).memberCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary?.data?.milestoneCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Milestones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Loading skeleton
const ProgramDetailsHeaderSkeleton = () => (
  <div className="border-b bg-background/95">
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <Skeleton className="h-8 w-32 mb-4" />
      
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-full max-w-md mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);
