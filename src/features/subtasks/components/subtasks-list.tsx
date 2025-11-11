"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateSubtask } from "../api/use-create-subtask";
import { useGetSubtasks } from "../api/use-get-subtasks";
import { SubtaskItem } from "./subtask-item";

interface SubtasksListProps {
  workItemId: string;
  workspaceId: string;
}

export const SubtasksList = ({ workItemId, workspaceId }: SubtasksListProps) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: subtasksData, isLoading } = useGetSubtasks({ 
    workspaceId, 
    workItemId 
  });
  const { mutate: createSubtask, isPending: isCreating } = useCreateSubtask();

  const subtasks = subtasksData?.documents || [];
  const completedCount = subtasks.filter((st) => st.completed).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      createSubtask(
        {
          title: newSubtaskTitle.trim(),
          workItemId,
          workspaceId,
          completed: false,
        },
        {
          onSuccess: () => {
            setNewSubtaskTitle("");
            setIsAdding(false);
          },
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddSubtask();
    } else if (e.key === "Escape") {
      setNewSubtaskTitle("");
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.$id}
            subtask={subtask}
            workspaceId={workspaceId}
            workItemId={workItemId}
          />
        ))}
      </div>

      {/* Add new subtask */}
      {isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a subtask..."
            className="h-9 text-sm"
            autoFocus
            disabled={isCreating}
          />
          <Button 
            onClick={handleAddSubtask} 
            size="sm" 
            className="h-9"
            disabled={isCreating || !newSubtaskTitle.trim()}
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
          <Button 
            onClick={() => {
              setNewSubtaskTitle("");
              setIsAdding(false);
            }} 
            variant="ghost"
            size="sm" 
            className="h-9"
            disabled={isCreating}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-sm"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="size-4 mr-2" />
          Add subtask
        </Button>
      )}

      {/* Empty state */}
      {totalCount === 0 && !isAdding && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No subtasks yet. Click the button above to add one.
        </div>
      )}
    </div>
  );
};
