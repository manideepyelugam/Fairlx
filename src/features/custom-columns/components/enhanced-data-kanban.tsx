"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";

import { KanbanCard } from "@/features/tasks/components/kanban-card";
import { KanbanColumnHeader } from "@/features/tasks/components/kanban-column-header";
import { BulkActionsToolbar } from "@/features/tasks/components/bulk-actions-toolbar";

import { Task, TaskStatus } from "@/features/tasks/types";
import { useBulkUpdateTasks } from "@/features/tasks/api/use-bulk-update-tasks";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { useGetCustomColumns } from "../api/use-get-custom-columns";
import { useManageColumnsModal } from "../hooks/use-manage-columns-modal";
import { useDefaultColumns } from "../hooks/use-default-columns";
import { CustomColumnHeader } from "./custom-column-header";
import { CustomColumn } from "../types";



type TasksState = {
  [key: string]: Task[]; // Using string to support both TaskStatus and custom column IDs
};

interface EnhancedDataKanbanProps {
  data: Task[] | undefined; // Allow undefined data
  onChange: (
    tasks: { $id: string; status: TaskStatus | string; position: number }[]
  ) => void;
  isAdmin?: boolean;
  members?: Array<{ $id: string; name: string }>;
}

export const EnhancedDataKanban = ({ 
  data = [], // Default to empty array
  onChange, 
  isAdmin = false,
  members = []
}: EnhancedDataKanbanProps) => {
  // Log basic props each render (non-conditional to avoid hook order issues)
  console.log('EnhancedDataKanban render:', { 
    dataLength: Array.isArray(data) ? data.length : 'not-array', 
    isAdmin, 
    membersLength: Array.isArray(members) ? members.length : 'not-array' 
  });

  const workspaceId = useWorkspaceId();
  console.log('workspaceId:', workspaceId);

  const { data: customColumns, isLoading: isLoadingColumns, error: columnsError } = useGetCustomColumns({ workspaceId });
  if (process.env.NODE_ENV !== 'production') {
    console.debug('Custom column count:', customColumns?.documents?.length ?? 0);
  }
  console.log('customColumns:', { 
    columns: customColumns, 
    isLoading: isLoadingColumns, 
    error: columnsError 
  });

  const { open: openManageModal } = useManageColumnsModal();
  const { getEnabledColumns } = useDefaultColumns(workspaceId);

  // Always call hooks – never inside conditionals/returns
  const [ConfirmDialog] = useConfirm(
    "Move Tasks",
    "Moving tasks from a deleted custom column to 'TODO'. Continue?",
    "outline"
  );

  // Combine enabled default boards with custom columns (safe when loading)
  const allColumns = useMemo(() => [
    ...getEnabledColumns.map(col => ({ id: col.id, type: "default" as const, status: col.id })),
    ...(customColumns?.documents || []).map(col => ({ 
      id: col.$id, 
      type: "custom" as const, 
      customColumn: col 
    }))
  ], [getEnabledColumns, customColumns?.documents]);

  const [tasks, setTasks] = useState<TasksState>({});

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();

  // Update tasks when data changes or columns change
  useEffect(() => {
    const newTasks: TasksState = {};
    
    // Initialize all enabled columns
    allColumns.forEach(col => {
      newTasks[col.id] = [];
    });

    // Ensure TODO exists as fallback (if it's enabled)
    const todoColumn = allColumns.find(col => col.id === TaskStatus.TODO);
    if (!newTasks[TaskStatus.TODO] && todoColumn) {
      newTasks[TaskStatus.TODO] = [];
    }

    // Process data with safety check
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((task) => {
        const taskStatus = task.status;
        
        // Check if task belongs to an enabled column
        if (newTasks[taskStatus]) {
          newTasks[taskStatus].push(task);
        } else {
          // Task is in a disabled/non-existent column, move to TODO if available
          if (newTasks[TaskStatus.TODO]) {
            newTasks[TaskStatus.TODO].push(task);
          } else {
            // If TODO is also disabled, move to first available enabled column
            const firstEnabledColumn = Object.keys(newTasks)[0];
            if (firstEnabledColumn) {
              newTasks[firstEnabledColumn].push(task);
            }
          }
        }
      });
    }

    // Sort tasks by position in each column
    Object.keys(newTasks).forEach((columnId) => {
      newTasks[columnId].sort((a, b) => a.position - b.position);
    });

    setTasks(newTasks);
  }, [data, allColumns]);

  const handleTaskSelect = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((columnId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      const columnTasks = tasks[columnId];
      
      if (selected) {
        columnTasks.forEach(task => newSet.add(task.$id));
      } else {
        columnTasks.forEach(task => newSet.delete(task.$id));
      }
      
      return newSet;
    });
  }, [tasks]);

  const handleClearSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedTasks(new Set());
    }
  }, [selectionMode]);

  const handleBulkStatusChange = useCallback((status: TaskStatus | string) => {
    if (selectedTasks.size === 0) return;

    const updates = Array.from(selectedTasks).map(taskId => ({
      $id: taskId,
      status,
    }));

    if (updates.length === 0) return; // Additional guard

    bulkUpdateTasks({
      json: { tasks: updates }
    });

    setSelectedTasks(new Set());
  }, [selectedTasks, bulkUpdateTasks]);

  const handleBulkAssigneeChange = useCallback((assigneeId: string) => {
    if (selectedTasks.size === 0) return;

    const updates = Array.from(selectedTasks).map(taskId => ({
      $id: taskId,
      assigneeId,
    }));

    if (updates.length === 0) return; // Additional guard

    bulkUpdateTasks({
      json: { tasks: updates }
    });

    setSelectedTasks(new Set());
  }, [selectedTasks, bulkUpdateTasks]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const { source, destination } = result;
      const sourceColumnId = source.droppableId;
      const destColumnId = destination.droppableId;

      let updatesPayload: {
        $id: string;
        status: TaskStatus | string;
        position: number;
      }[] = [];

      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };

        const sourceColumn = [...newTasks[sourceColumnId]];
        const [movedTask] = sourceColumn.splice(source.index, 1);

        if (!movedTask) {
          console.error("No task found at the source index");
          return prevTasks;
        }

        const updatedMovedTask =
          sourceColumnId !== destColumnId
            ? { ...movedTask, status: destColumnId }
            : movedTask;

        newTasks[sourceColumnId] = sourceColumn;

        const destColumn = [...newTasks[destColumnId]];
        destColumn.splice(destination.index, 0, updatedMovedTask);
        newTasks[destColumnId] = destColumn;

        updatesPayload = [];

        updatesPayload.push({
          $id: updatedMovedTask.$id,
          status: destColumnId,
          position: Math.min((destination.index + 1) * 1000, 1_000_000),
        });

        newTasks[destColumnId].forEach((task, index) => {
          if (task && task.$id !== updatedMovedTask.$id) {
            const newPosition = Math.min((index + 1) * 1000, 1_000_000);
            if (task.position !== newPosition) {
              updatesPayload.push({
                $id: task.$id,
                status: destColumnId,
                position: newPosition,
              });
            }
          }
        });

        if (sourceColumnId !== destColumnId) {
          newTasks[sourceColumnId].forEach((task, index) => {
            if (task) {
              const newPosition = Math.min((index + 1) * 1000, 1_000_000);
              if (task.position !== newPosition) {
                updatesPayload.push({
                  $id: task.$id,
                  status: sourceColumnId,
                  position: newPosition,
                });
              }
            }
          });
        }

        return newTasks;
      });

      // Only call onChange if we have valid updates
      if (Array.isArray(updatesPayload) && updatesPayload.length > 0) {
        onChange(updatesPayload);
      }
    },
    [onChange]
  );

  // Derive body content states (keep hooks above regardless of state)
  let body: React.ReactNode = null;

  if (isLoadingColumns) {
    body = (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  } else if (columnsError) {
    body = (
      <div className="flex items-center justify-center h-48">
        <div className="text-red-500">Error loading custom columns</div>
      </div>
    );
  } else {
    body = (
      <>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant={selectionMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={toggleSelectionMode}
                >
                  {selectionMode ? "Exit Selection" : "Select Tasks"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openManageModal}
                >
                  <Settings2Icon className="size-4 mr-2" />
                  Manage Columns
                </Button>
              </>
            )}
            {selectionMode && selectedTasks.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex overflow-x-auto">
            {allColumns.map((column) => {
              const columnTasks = tasks[column.id] || [];
              const selectedInColumn = columnTasks.filter(task => 
                selectedTasks.has(task.$id)
              ).length;

              return (
                <div
                  key={column.id}
                  className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[200px]"
                >
                  {column.type === "default" ? (
                    <KanbanColumnHeader
                      board={column.status}
                      taskCount={columnTasks.length}
                      selectedCount={selectedInColumn}
                      onSelectAll={(status, selected) => handleSelectAll(column.id, selected)}
                      showSelection={selectionMode}
                    />
                  ) : (
                    <CustomColumnHeader
                      customColumn={column.customColumn as CustomColumn}
                      taskCount={columnTasks.length}
                      selectedCount={selectedInColumn}
                      onSelectAll={handleSelectAll}
                      showSelection={selectionMode}
                      showDelete={isAdmin}
                    />
                  )}
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="min-h-[200px] py-1.5"
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={task.$id}
                            draggableId={task.$id}
                            index={index}
                            isDragDisabled={selectionMode}
                          >
                            {(provided) => (
                              <div
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                ref={provided.innerRef}
                              >
                                <KanbanCard 
                                  task={task} 
                                  isSelected={selectedTasks.has(task.$id)}
                                  onSelect={handleTaskSelect}
                                  showSelection={selectionMode}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        <BulkActionsToolbar
          selectedCount={selectedTasks.size}
          onClearSelection={handleClearSelection}
          onStatusChange={handleBulkStatusChange}
          onAssigneeChange={handleBulkAssigneeChange}
          isAdmin={isAdmin}
          assignees={members}
        />
      </>
    );
  }

  return (
    <>
      <ConfirmDialog />
      {body}
    </>
  );
};
