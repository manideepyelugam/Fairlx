"use client";

import {
  MoreHorizontal,
  Trash,
  Copy,
  Flag,
  Users,
  AlertCircle,
  Layers,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useDeleteWorkItem } from "../api/use-delete-work-item";
import { useUpdateWorkItem } from "../api/use-update-work-item";
import { useConfirm } from "@/hooks/use-confirm";
import { PopulatedWorkItem, WorkItemPriority } from "../types";

interface WorkItemOptionsMenuProps {
  workItem: PopulatedWorkItem;
  onSplit?: () => void;
  onAssignEpic?: () => void;
  onAssignAssignee?: () => void;
  onEditStoryPoints?: () => void;
}

export const WorkItemOptionsMenu = ({
  workItem,
  onSplit,
  onAssignEpic,
  onAssignAssignee,
  onEditStoryPoints,
}: WorkItemOptionsMenuProps) => {
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Work Item",
    `Are you sure you want to delete "${workItem.key}"? This action cannot be undone.`,
    "destructive"
  );

  const { mutate: deleteWorkItem, isPending: isDeleting } = useDeleteWorkItem();
  const { mutate: updateWorkItem, isPending: isUpdating } = useUpdateWorkItem();

  const handleDelete = async () => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    deleteWorkItem({ param: { workItemId: workItem.$id } });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/workspaces/${workItem.workspaceId}/projects/${workItem.projectId}/work-items/${workItem.$id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(workItem.key);
    toast.success("Key copied to clipboard");
  };

  const handleToggleFlag = () => {
    updateWorkItem({
      param: { workItemId: workItem.$id },
      json: { flagged: !workItem.flagged },
    });
  };

  const handleSetPriority = (priority: WorkItemPriority) => {
    updateWorkItem({
      param: { workItemId: workItem.$id },
      json: { priority },
    });
  };

  return (
    <>
      <DeleteDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="size-4 mr-2" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyKey}>
            <Copy className="size-4 mr-2" />
            Copy Key ({workItem.key})
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleFlag}>
            <Flag
              className={`size-4 mr-2 ${workItem.flagged ? "fill-red-500 text-red-500" : ""}`}
            />
            {workItem.flagged ? "Remove Flag" : "Add Flag"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onAssignAssignee}>
            <Users className="size-4 mr-2" />
            Assign Assignee
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <AlertCircle className="size-4 mr-2" />
              Set Priority
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleSetPriority(WorkItemPriority.LOW)}
                disabled={isUpdating}
              >
                Low
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSetPriority(WorkItemPriority.MEDIUM)}
                disabled={isUpdating}
              >
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSetPriority(WorkItemPriority.HIGH)}
                disabled={isUpdating}
              >
                High
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSetPriority(WorkItemPriority.URGENT)}
                disabled={isUpdating}
              >
                Urgent
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={onAssignEpic}>
            <Layers className="size-4 mr-2" />
            Assign Parent Epic
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEditStoryPoints}>
            <AlertCircle className="size-4 mr-2" />
            Edit Story Points
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSplit}>
            <GitBranch className="size-4 mr-2" />
            Split Work Item
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="size-4 mr-2" />
            Delete Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
