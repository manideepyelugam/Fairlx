"use client";

import {
  MoreHorizontal,
  Trash2,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { useDeleteSprint } from "../api/use-delete-sprint";
import { useUpdateSprint } from "../api/use-update-sprint";
import { useConfirm } from "@/hooks/use-confirm";
import { PopulatedSprint, SprintStatus } from "../types";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
// import { useCurrentMember } from "@/features/members/api/use-current-member";
import {useCurrentMember} from "@/features/members/hooks/use-current-member";

interface SprintOptionsMenuProps {
  sprint: PopulatedSprint;
  hasActiveSprint?: boolean;
  projectId?: string;
}

const statusConfig = {
  [SprintStatus.PLANNED]: {
    label: "Planned",
    icon: Clock,
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground/30",
  },
  [SprintStatus.ACTIVE]: {
    label: "Active",
    icon: Zap,
    color: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  [SprintStatus.COMPLETED]: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    dotColor: "bg-green-500",
  },
  [SprintStatus.CANCELLED]: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  },
};

export const SprintOptionsMenu = ({
  sprint,
  hasActiveSprint,
  projectId,
}: SprintOptionsMenuProps) => {
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Sprint",
    `Are you sure you want to delete "${sprint.name}"? Work items will be moved to backlog.`,
    "destructive"
  );

  const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint();
  const { mutate: updateSprint, isPending: isUpdating } = useUpdateSprint();

  const { can } = usePermission();
  
   // Get project-level sprint permissions
    const {
      canEditSprintsProject,
      canDeleteSprintsProject,
      canStartSprintProject,
      canCompleteSprintProject,
    } = useProjectPermissions({ projectId, workspaceId: sprint.workspaceId });
  
  // Check if user is workspace admin
  // const { data: currentMember } = useCurrentMember({ workspaceId: sprint.workspaceId });
    const { isAdmin: isWorkspaceAdmin } = useCurrentMember({ workspaceId: sprint.workspaceId });
  
  // Effective permissions (admin OR project-level OR workspace-level)
  const canEditSprints = isWorkspaceAdmin || canEditSprintsProject || can(PERMISSIONS.SPRINT_UPDATE);
  const canDeleteSprints = isWorkspaceAdmin || canDeleteSprintsProject || can(PERMISSIONS.SPRINT_DELETE);
  const canStartSprint = isWorkspaceAdmin || canStartSprintProject || can(PERMISSIONS.SPRINT_START);
  const canCompleteSprint = isWorkspaceAdmin || canCompleteSprintProject || can(PERMISSIONS.SPRINT_COMPLETE);

  const handleDelete = async () => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    deleteSprint({ param: { sprintId: sprint.$id } });
  };

  const handleStatusChange = (newStatus: SprintStatus) => {
    if (newStatus === sprint.status) return;
    updateSprint({
      param: { sprintId: sprint.$id },
      json: { status: newStatus },
    });
  };

  return (
    <>
      <DeleteDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-md  group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="size-4 text-foreground/70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            Update Status
          </DropdownMenuLabel>

          {Object.entries(statusConfig).map(([status, config]) => {
            const StatusIcon = config.icon;

            // Permission Checks
            if (status === SprintStatus.ACTIVE && !canStartSprint) return null;
            if (status === SprintStatus.COMPLETED && !canCompleteSprint) return null;
            // For PLANNED and CANCELLED status changes, require edit permission
            if ((status === SprintStatus.PLANNED || status === SprintStatus.CANCELLED) && !canEditSprints) return null;

            const isDisabled = isUpdating || (status === SprintStatus.ACTIVE && hasActiveSprint && sprint.status !== SprintStatus.ACTIVE);
            const isCurrentStatus = sprint.status === status;

            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status as SprintStatus)}
                disabled={isDisabled}
                className={cn(
                  "text-xs cursor-pointer py-1.5 px-2",
                  isCurrentStatus && "bg-muted"
                )}
                title={isDisabled && status === SprintStatus.ACTIVE ? "Another sprint is already active" : undefined}
              >
                <div className="flex items-center gap-2 flex-1">
                  <StatusIcon className={cn("size-3.5", config.color)} />
                  <span className={cn(isCurrentStatus && "font-medium")}>{config.label}</span>
                </div>
                {isCurrentStatus && (
                  <CheckCircle2 className="size-3.5 text-blue-600 ml-auto" />
                )}
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator className="my-1" />

          {canDeleteSprints && (
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 text-xs cursor-pointer py-1.5 px-2"
            >
              <Trash2 className="size-3.5 mr-2" />
              Delete Sprint
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
