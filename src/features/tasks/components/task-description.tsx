import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

import { useUpdateTask } from "../api/use-update-task";
import { Task } from "../types";

interface TaskDescriptionProps {
  task: Task;
  canEdit?: boolean;
}

export const TaskDescription = ({ task, canEdit = true }: TaskDescriptionProps) => {
  const [value, setValue] = useState(task.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: updateTask } = useUpdateTask();

  const debouncedValue = useDebounce(value, 1000);

  // Auto-save when debounced value changes
  useEffect(() => {
    if (hasChanges && debouncedValue !== task.description) {
      setIsSaving(true);
      updateTask(
        { json: { description: debouncedValue }, param: { taskId: task.$id } },
        {
          onSuccess: () => {
            setIsSaving(false);
            setHasChanges(false);
          },
          onError: () => {
            setIsSaving(false);
            toast.error("Failed to save description");
          },
        }
      );
    }
  }, [debouncedValue, hasChanges, task.$id, task.description, updateTask]);

  // Update value when task.description changes externally
  useEffect(() => {
    if (!hasChanges) {
      setValue(task.description || "");
    }
  }, [task.description, hasChanges]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canEdit) return;
    setValue(e.target.value);
    setHasChanges(true);
    autoResize(e.target);
  };

  // Auto-resize textarea
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Initial auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [value]);

  return (
    <div className="relative ">
      {/* Status indicator */}
      {isSaving && (
        <div className="absolute -top-6 right-0 flex items-center gap-1 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder="Add description..."
        disabled={!canEdit}
        className={cn(
          "w-full resize-none border-0 bg-transparent text-sm text-gray-700 placeholder:text-gray-400",
          "focus:outline-none focus:ring-0 min-h-[60px] p-0",
          !canEdit && "cursor-default"
        )}
        rows={3}
      />
    </div>
  );
};
