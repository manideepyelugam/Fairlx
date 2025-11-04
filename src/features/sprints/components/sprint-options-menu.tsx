"use client";

import {
  MoreHorizontal,
  Trash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useDeleteSprint } from "../api/use-delete-sprint";
import { useConfirm } from "@/hooks/use-confirm";
import { PopulatedSprint } from "../types";

interface SprintOptionsMenuProps {
  sprint: PopulatedSprint;
}

export const SprintOptionsMenu = ({
  sprint,
}: SprintOptionsMenuProps) => {
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Sprint",
    `Are you sure you want to delete "${sprint.name}"? Work items will be moved to backlog.`,
    "destructive"
  );

  const { mutate: deleteSprint, isPending } = useDeleteSprint();

  const handleDelete = async () => {
    const confirmed = await confirmDelete();
    if (!confirmed) return;

    deleteSprint({ param: { sprintId: sprint.$id } });
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
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="size-4 mr-2" />
            Delete Sprint
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
