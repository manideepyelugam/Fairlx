import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TimelineSprintGroup, TimelineItem, STATUS_COLORS } from "../types";
import { WorkItemIcon } from "./work-item-icon";

interface TimelineWorkTreeProps {
  sprintGroups: TimelineSprintGroup[];
  selectedItemId: string | null;
  onItemClick: (itemId: string) => void;
  onToggleExpanded: (itemId: string) => void;
}

export function TimelineWorkTree({
  sprintGroups,
  selectedItemId,
  onItemClick,
  onToggleExpanded,
}: TimelineWorkTreeProps) {
  return (
    <div className="w-[400px] border-r bg-card overflow-y-auto flex-shrink-0">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b px-4 py-3 font-semibold text-sm z-10">
        <div className="flex items-center gap-2">
          <span className="flex-1">Sprints</span>
        </div>
      </div>

      {/* Sprint Groups */}
      <div>
        {sprintGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sprints found
          </div>
        ) : (
          sprintGroups.map((sprintGroup) => (
            <SprintGroupRow
              key={sprintGroup.sprint.$id}
              sprintGroup={sprintGroup}
              selectedItemId={selectedItemId}
              onItemClick={onItemClick}
              onToggleExpanded={onToggleExpanded}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SprintGroupRowProps {
  sprintGroup: TimelineSprintGroup;
  selectedItemId: string | null;
  onItemClick: (itemId: string) => void;
  onToggleExpanded: (itemId: string) => void;
}

function SprintGroupRow({
  sprintGroup,
  selectedItemId,
  onItemClick,
  onToggleExpanded,
}: SprintGroupRowProps) {
  const { sprint, epics, isExpanded } = sprintGroup;

  return (
    <div className="border-b">
      {/* Sprint Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 cursor-pointer bg-muted/30"
        onClick={() => onToggleExpanded(sprint.$id)}
      >
        <button className="p-0 hover:bg-transparent">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <span className="font-semibold text-sm flex-1">{sprint.name}</span>
        <Badge variant="secondary" className="text-xs">
          {sprint.status}
        </Badge>
      </div>

      {/* Epic Groups - Jira style */}
      {isExpanded && (
        <div className="bg-card">
          {epics.map((epicGroup) => (
            <EpicGroupRow
              key={epicGroup.epic.id}
              epicGroup={epicGroup}
              selectedItemId={selectedItemId}
              onItemClick={onItemClick}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EpicGroupRowProps {
  epicGroup: {
    epic: TimelineItem;
    tasks: TimelineItem[];
    isExpanded: boolean;
  };
  selectedItemId: string | null;
  onItemClick: (itemId: string) => void;
  onToggleExpanded: (itemId: string) => void;
}

function EpicGroupRow({
  epicGroup,
  selectedItemId,
  onItemClick,
  onToggleExpanded,
}: EpicGroupRowProps) {
  const { epic, tasks, isExpanded } = epicGroup;

  // Check if this is a virtual "No Epic" group
  const isNoEpicGroup = epic.id.startsWith('no-epic-');

  return (
    <div className="border-l-2 border-violet-200 ml-4">
      {/* Epic Row - Jira style with expand icon on left */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border",
          selectedItemId === epic.id && "bg-blue-100/50",
          isNoEpicGroup && "bg-muted/50 italic text-muted-foreground"
        )}
        onClick={() => !isNoEpicGroup && onItemClick(epic.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded(epic.id);
          }}
          className="p-0 hover:bg-transparent flex-shrink-0"
        >
          {tasks.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
        </button>

        {/* Epic Icon - hide for "No Epic" group */}
        {!isNoEpicGroup && (
          <WorkItemIcon type={epic.type} className="h-4 w-4 flex-shrink-0" />
        )}

        {/* Epic Key and Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!isNoEpicGroup && (
              <span className="text-xs font-mono text-violet-600 font-semibold flex-shrink-0">
                {epic.key}
              </span>
            )}
            <span className={cn(
              "text-sm font-medium truncate",
              isNoEpicGroup && "text-muted-foreground"
            )}>
              {epic.title}
            </span>
          </div>
        </div>
      </div>

      {/* Task Rows - shown when epic is expanded */}
      {isExpanded && tasks.length > 0 && (
        <div className="bg-muted/30">
          {tasks.map((task) => (
            <div key={task.id}>
              <WorkItemRow
                item={task}
                level={2}
                isSelected={selectedItemId === task.id}
                onItemClick={onItemClick}
                onToggleExpanded={onToggleExpanded}
                hasChildren={task.childrenCount ? task.childrenCount > 0 : false}
                isExpanded={task.isExpanded || false}
              />

              {/* Subtask Rows */}
              {task.isExpanded && task.children && (
                <div className="bg-muted/50">
                  {task.children.map((subtask) => (
                    <WorkItemRow
                      key={subtask.id}
                      item={subtask}
                      level={3}
                      isSelected={selectedItemId === subtask.id}
                      onItemClick={onItemClick}
                      onToggleExpanded={onToggleExpanded}
                      hasChildren={false}
                      isExpanded={false}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface WorkItemRowProps {
  item: TimelineItem;
  level: number;
  isSelected: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onItemClick: (itemId: string) => void;
  onToggleExpanded: (itemId: string) => void;
}

function WorkItemRow({
  item,
  level,
  isSelected,
  hasChildren,
  isExpanded,
  onItemClick,
  onToggleExpanded,
}: WorkItemRowProps) {
  // Provide a fallback status color in case status is undefined or invalid
  const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.TODO;

  // Calculate left padding based on level (Jira style indentation)
  const paddingLeft = level === 2 ? "pl-8" : level === 3 ? "pl-12" : "pl-4";

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 hover:bg-accent/30 cursor-pointer transition-colors border-b border-border",
        paddingLeft,
        isSelected && "bg-blue-100/50 ring-1 ring-blue-300 ring-inset"
      )}
      onClick={() => onItemClick(item.id)}
    >
      {/* Expand/Collapse Icon */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded(item.id);
          }}
          className="p-0 hover:bg-transparent flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div className="w-3.5" />
      )}

      {/* Type Icon */}
      <WorkItemIcon type={item.type} className="h-3.5 w-3.5 flex-shrink-0" />

      {/* Key and Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-blue-600 font-medium flex-shrink-0">
            {item.key}
          </span>
          <span className="text-sm truncate">{item.title}</span>
        </div>
      </div>

      {/* Status Badge - more compact like Jira */}
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5 py-0 h-5 uppercase font-medium flex-shrink-0",
          statusStyle.bg,
          statusStyle.text,
          statusStyle.border
        )}
      >
        {item.status.replace("_", " ")}
      </Badge>

      {/* Assignee Avatars - compact */}
      {/* Filter out null/undefined assignees to handle deleted users, permission-masked relations, or legacy data */}
      {(() => {
        const validAssignees = item.assignees?.filter(
          (a): a is NonNullable<typeof a> => a != null && typeof a.name === "string"
        ) ?? [];
        return validAssignees.length > 0 ? (
          <div className="flex -space-x-1 flex-shrink-0">
            {validAssignees.slice(0, 2).map((assignee, index) => (
              <Avatar key={index} className="h-5 w-5 border border-white">
                {assignee.profileImageUrl ? (
                  <AvatarImage src={assignee.profileImageUrl} alt={assignee.name} />
                ) : null}
                <AvatarFallback className="text-[10px] bg-blue-100">
                  {assignee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {validAssignees.length > 2 && (
              <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[10px]">
                +{validAssignees.length - 2}
              </div>
            )}
          </div>
        ) : null;
      })()}
    </div>
  );
}
