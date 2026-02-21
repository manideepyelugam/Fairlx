"use client";

import * as React from "react";
import { resolveIconSync } from "@/lib/resolve-icon";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, snakeCaseToTitleCase } from "@/lib/utils";

import {
  CircleCheckIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
} from "lucide-react";

import { TaskStatus } from "@/features/tasks/types";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetCustomColumns } from "@/features/custom-columns/api/use-get-custom-columns";



export const statusIconMap: Record<TaskStatus, React.ReactNode> = {
  [TaskStatus.TODO]: <CircleIcon className="size-[18px] text-muted-foreground" />,
  [TaskStatus.ASSIGNED]: (
    <CircleIcon className="size-[18px] text-red-400" />
  ),
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

type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectTrigger>;

interface StatusSelectorProps
  extends Omit<
    SelectTriggerProps,
    "children" | "value" | "defaultValue" | "onValueChange" | "onChange"
  > {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  projectId?: string;
  disabled?: boolean;
}

export const StatusSelector = React.forwardRef<
  HTMLButtonElement,
  StatusSelectorProps
>(
  (
    {
      value,
      onChange,
      placeholder = "Select status",
      projectId,
      className,
      disabled = false,
      ...triggerProps
    },
    ref
  ) => {
    const workspaceId = useWorkspaceId();
    const { data: customColumns = { documents: [] } } = useGetCustomColumns({
      workspaceId,
      projectId,
    });

    const renderStatusItem = (
      statusValue: string,
      label: string,
      icon: React.ReactNode
    ) => (
      <SelectItem key={statusValue} value={statusValue}>
        <div className="flex items-center gap-x-2">
          {icon}
          {label}
        </div>
      </SelectItem>
    );

    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          ref={ref}
          className={cn("h-8", className)}
          disabled={disabled}
          {...triggerProps}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Default status options */}
          {Object.values(TaskStatus).map((status) =>
            renderStatusItem(
              status,
              snakeCaseToTitleCase(status),
              statusIconMap[status]
            )
          )}

          {/* Custom column options */}
          {customColumns.documents.length > 0 && (
            <>
              {/* Separator */}
              <div className="border-t my-1" />
              {customColumns.documents.map((column) => {
                const IconComponent = resolveIconSync(column.icon);
                const icon = (
                  <IconComponent
                    className="size-[18px]"
                    style={{ color: column.color }}
                  />
                );

                return renderStatusItem(column.$id, column.name, icon);
              })}
            </>
          )}
        </SelectContent>
      </Select>
    );
  }
);

StatusSelector.displayName = "StatusSelector";
