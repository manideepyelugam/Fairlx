"use client";

import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Users,
  Calendar,
  Target,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { PopulatedProgram, ProgramStatus, ProgramPriority } from "../types";

interface ProgramCardProps {
  program: PopulatedProgram;
  workspaceId: string;
  showActions?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const statusConfig: Record<ProgramStatus, { label: string; color: string; bgColor: string }> = {
  [ProgramStatus.PLANNING]: {
    label: "Planning",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-500/10 border-gray-500/20",
  },
  [ProgramStatus.ACTIVE]: {
    label: "Active",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  [ProgramStatus.ON_HOLD]: {
    label: "On Hold",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
  [ProgramStatus.COMPLETED]: {
    label: "Completed",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  [ProgramStatus.CANCELLED]: {
    label: "Cancelled",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
  },
};

const priorityConfig: Record<ProgramPriority, { label: string; color: string }> = {
  [ProgramPriority.LOW]: { label: "Low", color: "text-gray-500" },
  [ProgramPriority.MEDIUM]: { label: "Medium", color: "text-blue-500" },
  [ProgramPriority.HIGH]: { label: "High", color: "text-amber-500" },
  [ProgramPriority.CRITICAL]: { label: "Critical", color: "text-red-500" },
};

export const ProgramCard = ({
  program,
  workspaceId,
  showActions = true,
  compact = false,
  onClick,
}: ProgramCardProps) => {
  const router = useRouter();
  const { open: openEditModal } = useEditProgramModal();
  const { mutate: deleteProgram, isPending: isDeleting } = useDeleteProgram();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Program",
    `Are you sure you want to delete "${program.name}"? This action cannot be undone.`,
    "destructive"
  );

  const statusInfo = statusConfig[program.status as ProgramStatus] || statusConfig[ProgramStatus.PLANNING];
  const priorityInfo = program.priority 
    ? priorityConfig[program.priority as ProgramPriority] 
    : null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/workspaces/${workspaceId}/programs/${program.$id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditModal(program.$id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirmDelete();
    if (!ok) return;
    
    deleteProgram({
      param: { programId: program.$id },
    });
  };

  // Calculate progress
  const progress = program.progress || 0;

  if (compact) {
    return (
      <>
        <DeleteDialog />
        <div
          onClick={handleClick}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "h-10 w-10 rounded-md flex items-center justify-center",
                program.color ? undefined : "bg-primary/10"
              )}
              style={program.color ? { backgroundColor: `${program.color}20` } : undefined}
            >
              <FolderKanban 
                className="h-5 w-5"
                style={program.color ? { color: program.color } : undefined}
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{program.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className={cn("text-xs", statusInfo.bgColor, statusInfo.color)}>
                  {statusInfo.label}
                </Badge>
                {program.projectCount !== undefined && (
                  <span>{program.projectCount} projects</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DeleteDialog />
      <Card
        onClick={handleClick}
        className={cn(
          "overflow-hidden hover:shadow-md transition-all cursor-pointer group",
          "border-border/50 hover:border-border"
        )}
      >
        {/* Color accent bar */}
        <div
          className="h-1 w-full"
          style={{ backgroundColor: program.color || "#3b82f6" }}
        />

        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
                  program.color ? undefined : "bg-primary/10"
                )}
                style={program.color ? { backgroundColor: `${program.color}20` } : undefined}
              >
                <FolderKanban 
                  className="h-6 w-6"
                  style={program.color ? { color: program.color } : undefined}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg truncate">{program.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-xs", statusInfo.bgColor, statusInfo.color)}>
                    {statusInfo.label}
                  </Badge>
                  {priorityInfo && (
                    <Badge variant="outline" className={cn("text-xs", priorityInfo.color)}>
                      {priorityInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleClick}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
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
        </CardHeader>

        <CardContent className="pb-4">
          {program.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {program.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>{program.projectCount ?? 0}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Projects</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{program.memberCount ?? 0}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Members</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Date info */}
            {(program.startDate || program.endDate) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {program.startDate && format(new Date(program.startDate), "MMM d")}
                {program.startDate && program.endDate && " - "}
                {program.endDate && format(new Date(program.endDate), "MMM d, yyyy")}
              </div>
            )}
          </div>

          {/* Program lead */}
          {program.programLead && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Avatar className="h-6 w-6">
                {program.programLead.profileImageUrl && (
                  <AvatarImage src={program.programLead.profileImageUrl} />
                )}
                <AvatarFallback className="text-xs">
                  {program.programLead.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Lead: {program.programLead.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
