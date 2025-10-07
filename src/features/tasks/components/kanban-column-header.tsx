import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
  PlusIcon,
  MoreHorizontalIcon,
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
    <div className="px-3 py-2 flex items-center justify-between mb-2">
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
        <h2 className="text-sm font-semibold text-gray-700">{snakeCaseToTitleCase(board)}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={open} variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100">
          <PlusIcon className="h-4 w-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100">
          <MoreHorizontalIcon className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
    </div>
  );
};

