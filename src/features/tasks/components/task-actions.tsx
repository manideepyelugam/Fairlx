import { ExternalLink, PencilIcon, TrashIcon, FlagIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/hooks/use-confirm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { useDeleteTask } from "../api/use-delete-task";
import { useUpdateTask } from "../api/use-update-task";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";

interface TaskActionsProps {
  id: string;
  projectId: string;
  children: React.ReactNode;
  flagged?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const TaskActions = ({
  id,
  projectId,
  children,
  flagged = false,
  canEdit = true,
  canDelete = true,
}: TaskActionsProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const { open } = useEditTaskModal();
  const { can } = usePermission();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Work Item",
    "This action cannot be undone.",
    "destructive"
  );
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask();
  const { mutate: updateTask, isPending: isUpdatingTask } = useUpdateTask();

  const onDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    deleteTask({ param: { taskId: id } });
  };

  const onToggleFlag = () => {
    updateTask({
      param: { taskId: id },
      json: { flagged: !flagged },
    });
  };

  const onOpenTask = () => {
    router.push(`/workspaces/${workspaceId}/tasks/${id}`);
  };

  const onOpenProject = () => {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
  };

  const canEditTask = canEdit && can(PERMISSIONS.WORKITEM_UPDATE);
  const canDeleteTask = canDelete && can(PERMISSIONS.WORKITEM_DELETE);

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <ConfirmDialog />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={onOpenTask}
            className="font-medium p-[10px]"
          >
            <ExternalLink className="size-4 mr-2 stroke-2" />
            Work Item Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onOpenProject}
            className="font-medium p-[10px]"
          >
            <ExternalLink className="size-4 mr-2 stroke-2" />
            Open Project
          </DropdownMenuItem>
          {canEditTask && (
            <DropdownMenuItem
              onClick={() => {
                open(id);
              }}
              className="font-medium p-[10px]"
            >
              <PencilIcon className="size-4 mr-2 stroke-2" />
              Edit Work Item
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onToggleFlag}
            disabled={isUpdatingTask}
            className="font-medium p-[10px]"
          >
            <FlagIcon className={`size-4 mr-2 stroke-2 ${flagged ? 'fill-red-500 text-red-500' : ''}`} />
            {flagged ? 'Unflag Work Item' : 'Flag Work Item'}
          </DropdownMenuItem>
          {canDeleteTask && (
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isDeletingTask}
              className="text-amber-700 focus:text-amber-700 font-medium p-[10px]"
            >
              <TrashIcon className="size-4 mr-2 stroke-2" />
              Delete Work Item
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
