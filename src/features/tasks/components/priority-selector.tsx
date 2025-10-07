import * as React from "react";
import { cn } from "@/lib/utils";
import { TaskPriority } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowDown, 
  Minus, 
  ArrowUp, 
  AlertTriangle 
} from "lucide-react";

interface PriorityIconProps {
  priority: TaskPriority;
  className?: string;
}

const PriorityIcon = ({ priority, className }: PriorityIconProps) => {
  const getIconStyle = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "text-blue-500";
      case TaskPriority.MEDIUM:
        return "text-yellow-500";
      case TaskPriority.HIGH:
        return "text-orange-500";
      case TaskPriority.URGENT:
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return <ArrowDown className="h-4 w-4" />;
      case TaskPriority.MEDIUM:
        return <Minus className="h-4 w-4" />;
      case TaskPriority.HIGH:
        return <ArrowUp className="h-4 w-4" />;
      case TaskPriority.URGENT:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <span className={cn(getIconStyle(priority), className)}>
      {getIcon(priority)}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  const getVariant = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "secondary";
      case TaskPriority.MEDIUM:
        return "default";
      case TaskPriority.HIGH:
        return "destructive";
      case TaskPriority.URGENT:
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Badge variant={getVariant(priority)} className={cn("text-xs", className)}>
      <PriorityIcon priority={priority} className="mr-1" />
      {priority}
    </Badge>
  );
};

type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectTrigger>;

interface PrioritySelectorProps
  extends Omit<
    SelectTriggerProps,
    "children" | "value" | "defaultValue" | "onValueChange"
  > {
  value?: TaskPriority;
  onValueChange: (value: TaskPriority) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PrioritySelector = React.forwardRef<
  HTMLButtonElement,
  PrioritySelectorProps
>(
  (
    {
      value,
      onValueChange,
      placeholder = "Select priority",
      disabled = false,
      className,
      ...triggerProps
    },
    ref
  ) => {
    return (
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          ref={ref}
          className={cn("h-8", className)}
          disabled={disabled}
          {...triggerProps}
        >
          <SelectValue placeholder={placeholder}>
            {value && (
              <div className="flex items-center">
                <PriorityIcon priority={value} className="mr-2" />
                {value}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(TaskPriority).map((priority) => (
            <SelectItem key={priority} value={priority}>
              <div className="flex items-center">
                <PriorityIcon priority={priority} className="mr-2" />
                {priority}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

PrioritySelector.displayName = "PrioritySelector";

export { PriorityIcon };