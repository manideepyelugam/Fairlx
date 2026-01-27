"use client";

import { useState } from "react";
import { Layers, ChevronDown, ChevronRight, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { PopulatedWorkItem, WorkItemType } from "../types";

interface EpicPanelProps {
  epics: PopulatedWorkItem[];
  workItems: PopulatedWorkItem[];
  selectedEpicId: string | null;
  onEpicSelect: (epicId: string | null) => void;
  onCreateEpic: () => void;
}

export const EpicPanel = ({
  epics,
  workItems,
  selectedEpicId,
  onEpicSelect,
  onCreateEpic,
}: EpicPanelProps) => {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const toggleEpicExpand = (epicId: string) => {
    setExpandedEpics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  };

  const getWorkItemCountForEpic = (epicId: string) => {
    return workItems.filter((item) =>
      item.type !== WorkItemType.EPIC && item.epicId === epicId
    ).length;
  };

  const getWorkItemsWithoutEpic = () => {
    return workItems.filter((item) =>
      item.type !== WorkItemType.EPIC && !item.epicId
    );
  };

  const workItemsWithoutEpic = getWorkItemsWithoutEpic();

  return (
    <div className="w-64 border border-border rounded-md flex flex-col bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Layers className="size-4 text-purple-500" />
            Epic
          </h3>
          {selectedEpicId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEpicSelect(null)}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Epic List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Issues without epic */}
          <button
            onClick={() => onEpicSelect("none")}
            className={cn(
              "w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left",
              selectedEpicId === "none" && "bg-accent"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-4 h-4 rounded bg-muted-foreground/30 shrink-0" />
              <span className="!text-xs font-normal truncate">
                Issues without epic
              </span>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {workItemsWithoutEpic.length}
            </Badge>
          </button>

          {/* Epic List */}
          <div className="mt-1 space-y-1">
            {epics.map((epic) => {
              const isExpanded = expandedEpics.has(epic.$id);
              const isSelected = selectedEpicId === epic.$id;
              const itemCount = getWorkItemCountForEpic(epic.$id);

              return (
                <div key={epic.$id}>
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-md hover:bg-accent transition-colors",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => toggleEpicExpand(epic.$id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronRight className="size-3" />
                      )}
                    </Button>
                    <button
                      onClick={() => onEpicSelect(epic.$id)}
                      className="flex items-center justify-between flex-1 min-w-0 p-2 pr-1"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-4 h-4 rounded bg-purple-500 shrink-0" />
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="text-sm font-medium truncate w-full">
                            {epic.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {epic.key}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {itemCount}
                      </Badge>
                    </button>
                  </div>

                  {/* Expanded epic details */}
                  {isExpanded && itemCount > 0 && (
                    <div className="ml-8 mt-1 mb-2 space-y-1">
                      {workItems
                        .filter((item) => item.epicId === epic.$id)
                        .slice(0, 5)
                        .map((item) => (
                          <div
                            key={item.$id}
                            className="text-xs text-muted-foreground p-1.5 hover:bg-muted rounded truncate"
                          >
                            {item.key}: {item.title}
                          </div>
                        ))}
                      {itemCount > 5 && (
                        <div className="text-xs text-muted-foreground p-1.5 italic">
                          +{itemCount - 5} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>



        </div>
        {/* Create Epic Button */}
        <div className=" border-t px-2 ">
          <Button
            variant="ghost"
            className="w-full text-xs bg-card border border-border shadow-sm justify-start text-muted-foreground mt-2"
            onClick={onCreateEpic}
          >
            <Plus className="size-4 mr-2" />
            Create epic
          </Button>
        </div>
      </ScrollArea>

    </div>
  );
};
