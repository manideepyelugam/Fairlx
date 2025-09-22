import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
  PlusIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { snakeCaseToTitleCase } from "@/lib/utils";

import { TaskStatus } from "../types";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";

const statusIconMap: Record<TaskStatus, React.ReactNode> = {
  [TaskStatus.BACKLOG]: (
    <CircleDashedIcon className="size-[18px] text-pink-400" />
  ),
  [TaskStatus.TODO]: <CircleIcon className="size-[18px] text-red-400" />,
  [TaskStatus.IN_PROGRESS]: (
    <CircleDotDashedIcon className="size-[18px] text-yellow-400" />
  ),
  [TaskStatus.IN_REVIEW]: (
    <CircleDotIcon className="size-[18px] text-blue-400" />
  ),
  [TaskStatus.DONE]: (
    <CircleCheckIcon className="size-[18px] text-emerald-400" />
  ),
};

interface KanbanColumnHeaderProps {
  board: TaskStatus;
  taskCount: number;
  selectedCount?: number;
  onSelectAll?: (status: TaskStatus, selected: boolean) => void;
  showSelection?: boolean;
}

export const KanbanColumnHeader = ({
  board,
  taskCount,
  selectedCount = 0,
  onSelectAll,
  showSelection = false,
}: KanbanColumnHeaderProps) => {
  const { open } = useCreateTaskModal();

  const icon = statusIconMap[board];

  const isAllSelected = taskCount > 0 && selectedCount === taskCount;
  const isPartiallySelected = selectedCount > 0 && selectedCount < taskCount;

  return (
    <div className="px-2 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-x-2">
        {showSelection && (
          <Checkbox
            checked={isAllSelected}
            ref={(ref) => {
              // Checkbox component forwards a button ref; cast to HTMLInputElement to set indeterminate
              if (ref) (ref as HTMLInputElement).indeterminate = isPartiallySelected;
            }}
            onCheckedChange={(checked) => onSelectAll?.(board, !!checked)}
          />
        )}
        {icon}
        <h2 className="text-sm font-medium">{snakeCaseToTitleCase(board)}</h2>
        <div className="size-5 flex items-center justify-center rounded-md bg-neutral-200 text-xs text-neutral-700 font-medium">
          {taskCount}
        </div>
        {showSelection && selectedCount > 0 && (
          <div className="size-5 flex items-center justify-center rounded-md bg-blue-200 text-xs text-blue-700 font-medium">
            {selectedCount}
          </div>
        )}
      </div>
      <Button onClick={open} variant="ghost" size="icon" className="size-5">
        <PlusIcon className="size-4 text-neutral-500" />
      </Button>
    </div>
  );
};
