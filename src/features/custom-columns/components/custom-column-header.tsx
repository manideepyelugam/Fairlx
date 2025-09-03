"use client";

import * as React from "react";
import * as Icons from "react-icons/ai";
import * as BiIcons from "react-icons/bi";
import * as BsIcons from "react-icons/bs";
import * as FaIcons from "react-icons/fa";
import * as FiIcons from "react-icons/fi";
import * as HiIcons from "react-icons/hi";
import * as IoIcons from "react-icons/io5";
import * as MdIcons from "react-icons/md";
import * as RiIcons from "react-icons/ri";
import * as TbIcons from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/hooks/use-confirm";

import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { useDeleteCustomColumn } from "../api/use-delete-custom-column";

import { CustomColumn } from "../types";

// Combine all icon sets
const allIcons = {
  ...Icons,
  ...BiIcons,
  ...BsIcons,
  ...FaIcons,
  ...FiIcons,
  ...HiIcons,
  ...IoIcons,
  ...MdIcons,
  ...RiIcons,
  ...TbIcons,
};

interface CustomColumnHeaderProps {
  customColumn: CustomColumn;
  taskCount: number;
  selectedCount?: number;
  onSelectAll?: (columnId: string, selected: boolean) => void;
  showSelection?: boolean;
  showDelete?: boolean;
}

export const CustomColumnHeader = ({
  customColumn,
  taskCount,
  selectedCount = 0,
  onSelectAll,
  showSelection = false,
  showDelete = false,
}: CustomColumnHeaderProps) => {
  const { open } = useCreateTaskModal();
  const { mutate: deleteCustomColumn } = useDeleteCustomColumn();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Column",
    "This will permanently delete the column and move all tasks in this column to 'TODO'. This action cannot be undone.",
    "destructive"
  );

  const IconComponent = allIcons[customColumn.icon as keyof typeof allIcons];

  const isAllSelected = taskCount > 0 && selectedCount === taskCount;
  const isPartiallySelected = selectedCount > 0 && selectedCount < taskCount;

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    deleteCustomColumn({ 
      param: { customColumnId: customColumn.$id } 
    });
  };

  return (
    <>
      <ConfirmDialog />
      <div className="px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          {showSelection && (
            <Checkbox
              checked={isAllSelected}
              ref={(ref) => {
                if (ref) (ref as any).indeterminate = isPartiallySelected;
              }}
              onCheckedChange={(checked) => onSelectAll?.(customColumn.$id, !!checked)}
            />
          )}
          {IconComponent && (
            <IconComponent 
              className="size-[18px]" 
              style={{ color: customColumn.color }}
            />
          )}
          <h2 className="text-sm font-medium">{customColumn.name}</h2>
          <div className="size-5 flex items-center justify-center rounded-md bg-neutral-200 text-xs text-neutral-700 font-medium">
            {taskCount}
          </div>
          {showSelection && selectedCount > 0 && (
            <div className="size-5 flex items-center justify-center rounded-md bg-blue-200 text-xs text-blue-700 font-medium">
              {selectedCount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-x-1">
          <Button onClick={open} variant="ghost" size="icon" className="size-5">
            <svg
              className="size-4 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
          {showDelete && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              className="size-5 text-red-500 hover:text-red-700"
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
