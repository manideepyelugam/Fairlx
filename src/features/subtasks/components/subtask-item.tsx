"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { Subtask } from "../types";
import { useUpdateSubtask } from "../api/use-update-subtask";
import { useDeleteSubtask } from "../api/use-delete-subtask";

interface SubtaskItemProps {
  subtask: Subtask;
  workspaceId: string;
  workItemId: string;
}

export const SubtaskItem = ({ subtask, workspaceId, workItemId }: SubtaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);

  const { mutate: updateSubtask, isPending: isUpdating } = useUpdateSubtask();
  const { mutate: deleteSubtask, isPending: isDeleting } = useDeleteSubtask();

  const handleToggleComplete = () => {
    updateSubtask({
      param: { subtaskId: subtask.$id },
      json: { completed: !subtask.completed },
    });
  };

  const handleSaveTitle = () => {
    if (title.trim() && title !== subtask.title) {
      updateSubtask({
        param: { subtaskId: subtask.$id },
        json: { title: title.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteSubtask({
      param: { subtaskId: subtask.$id },
      context: { workspaceId, workItemId },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setTitle(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group">
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={handleToggleComplete}
        disabled={isUpdating || isDeleting}
        className="size-4"
      />
      
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={cn(
            "text-sm flex-1 cursor-text",
            subtask.completed && "line-through text-muted-foreground"
          )}
        >
          {subtask.title}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <X className="size-3" />
        )}
      </Button>
    </div>
  );
};
