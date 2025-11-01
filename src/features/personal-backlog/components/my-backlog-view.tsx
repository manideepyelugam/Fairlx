"use client";

import { useState, useCallback, useMemo } from "react";
import { PlusIcon, Loader2, SearchIcon, FlagIcon, ClockIcon, CalendarIcon, Trash2Icon, MoreHorizontalIcon, CircleDashedIcon, CircleDotDashedIcon, CircleCheckIcon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useConfirm } from "@/hooks/use-confirm";

import { useGetBacklogItems } from "../api/use-get-backlog-items";
import { useCreateBacklogItem } from "../api/use-create-backlog-item";
import { useDeleteBacklogItem } from "../api/use-delete-backlog-item";
import { useBulkUpdateBacklogItems } from "../api/use-bulk-update-backlog-items";
import { BacklogItemType, BacklogItemPriority, BacklogItemStatus } from "../types";

interface MyBacklogViewProps {
  workspaceId: string;
}

export const MyBacklogView = ({ workspaceId }: MyBacklogViewProps) => {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BacklogItemStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<BacklogItemPriority | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<BacklogItemType | "ALL">("ALL");

  const { data, isLoading } = useGetBacklogItems({
    workspaceId,
    status: statusFilter === "ALL" ? null : statusFilter,
    priority: priorityFilter === "ALL" ? null : priorityFilter,
    type: typeFilter === "ALL" ? null : typeFilter,
    search: searchQuery || null,
  });

  const { mutate: createItem, isPending: isCreating } = useCreateBacklogItem();
  const { mutate: deleteItem } = useDeleteBacklogItem();
  const { mutate: bulkUpdate } = useBulkUpdateBacklogItems();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete item",
    "Are you sure you want to delete this backlog item?",
    "destructive"
  );

  // Group items by status
  const groupedItems = useMemo(() => {
    const items = data?.documents ?? [];
    return {
      [BacklogItemStatus.TODO]: items.filter((item) => item.status === BacklogItemStatus.TODO),
      [BacklogItemStatus.IN_PROGRESS]: items.filter((item) => item.status === BacklogItemStatus.IN_PROGRESS),
      [BacklogItemStatus.DONE]: items.filter((item) => item.status === BacklogItemStatus.DONE),
    };
  }, [data?.documents]);

  const handleCreateItem = () => {
    if (!newItemTitle.trim()) return;

    createItem(
      {
        title: newItemTitle,
        workspaceId,
        priority: BacklogItemPriority.MEDIUM,
        status: BacklogItemStatus.TODO,
        type: BacklogItemType.TASK,
        flagged: false,
      },
      {
        onSuccess: () => {
          setNewItemTitle("");
        },
      }
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    const ok = await confirm();
    if (ok) {
      deleteItem({ param: { itemId } });
    }
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStatus = source.droppableId as BacklogItemStatus;
    const destStatus = destination.droppableId as BacklogItemStatus;

    const sourceItems = [...groupedItems[sourceStatus]];
    const destItems = sourceStatus === destStatus ? sourceItems : [...groupedItems[destStatus]];

    const [movedItem] = sourceItems.splice(source.index, 1);

    if (!movedItem) {
      console.warn("No item found at the source index");
      return;
    }

    if (sourceStatus === destStatus) {
      sourceItems.splice(destination.index, 0, movedItem);
    } else {
      destItems.splice(destination.index, 0, movedItem);
    }

    const updatesToMake = sourceStatus === destStatus
      ? sourceItems.map((item, idx) => ({
          $id: item.$id,
          status: sourceStatus,
          position: Math.min((idx + 1) * 1000, 1_000_000),
        }))
      : [
          ...sourceItems.map((item, idx) => ({
            $id: item.$id,
            status: sourceStatus,
            position: Math.min((idx + 1) * 1000, 1_000_000),
          })),
          ...destItems.map((item, idx) => ({
            $id: item.$id,
            status: destStatus,
            position: Math.min((idx + 1) * 1000, 1_000_000),
          })),
        ];

    bulkUpdate({ items: updatesToMake });
  }, [groupedItems, bulkUpdate]);

  const getPriorityColor = (priority: BacklogItemPriority) => {
    switch (priority) {
      case BacklogItemPriority.URGENT:
        return "text-red-600 bg-red-50 border-red-200";
      case BacklogItemPriority.HIGH:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case BacklogItemPriority.MEDIUM:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case BacklogItemPriority.LOW:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getTypeIcon = (type: BacklogItemType) => {
    switch (type) {
      case BacklogItemType.TASK:
        return "📋";
      case BacklogItemType.BUG:
        return "🐛";
      case BacklogItemType.IDEA:
        return "💡";
      case BacklogItemType.IMPROVEMENT:
        return "🚀";
    }
  };

  return (
    <>
      <ConfirmDialog />
      <div className="h-full flex flex-col p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Backlog</h1>
            <p className="text-muted-foreground mt-1">Your personal task backlog and ideas</p>
          </div>

          {/* Create New Item */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a new item..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateItem();
                }
              }}
              className="flex-1"
              disabled={isCreating}
            />
            <Button onClick={handleCreateItem} disabled={isCreating || !newItemTitle.trim()}>
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
              Add Item
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BacklogItemStatus | "ALL")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value={BacklogItemStatus.TODO}>To Do</SelectItem>
                <SelectItem value={BacklogItemStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={BacklogItemStatus.DONE}>Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as BacklogItemPriority | "ALL")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priority</SelectItem>
                <SelectItem value={BacklogItemPriority.URGENT}>Urgent</SelectItem>
                <SelectItem value={BacklogItemPriority.HIGH}>High</SelectItem>
                <SelectItem value={BacklogItemPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={BacklogItemPriority.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as BacklogItemType | "ALL")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value={BacklogItemType.TASK}>Task</SelectItem>
                <SelectItem value={BacklogItemType.BUG}>Bug</SelectItem>
                <SelectItem value={BacklogItemType.IDEA}>Idea</SelectItem>
                <SelectItem value={BacklogItemType.IMPROVEMENT}>Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Backlog Board */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex overflow-x-auto gap-4 pb-4">
              {Object.entries(groupedItems).map(([status, items]) => {
                const statusIcon = 
                  status === BacklogItemStatus.TODO ? <CircleDashedIcon className="size-[18px] text-pink-400" /> :
                  status === BacklogItemStatus.IN_PROGRESS ? <CircleDotDashedIcon className="size-[18px] text-yellow-400" /> :
                  <CircleCheckIcon className="size-[18px] text-emerald-400" />;

                const statusTitle = 
                  status === BacklogItemStatus.TODO ? "To Do" :
                  status === BacklogItemStatus.IN_PROGRESS ? "In Progress" :
                  "Done";

                return (
                  <div
                    key={status}
                    className="flex-1 bg-gray-50 rounded-xl min-w-[280px] max-w-[320px]"
                  >
                    {/* Column Header */}
                    <div className="px-3 py-2 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-x-2">
                        {statusIcon}
                        <h2 className="text-sm font-semibold text-gray-700">{statusTitle}</h2>
                        <span className="text-xs text-muted-foreground">({items.length})</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100">
                        <MoreHorizontalIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>

                    <Droppable droppableId={status}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="min-h-[500px] px-3 pb-3"
                        >
                          {items.map((item, index) => (
                            <Draggable key={item.$id} draggableId={item.$id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <Card className={`mb-2 p-3 cursor-grab active:cursor-grabbing bg-white hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? "shadow-lg rotate-2 opacity-90" : ""
                                  }`}>
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                          <span className="text-lg">{getTypeIcon(item.type)}</span>
                                          <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                                          {item.flagged && <FlagIcon className="size-3 text-red-500 flex-shrink-0" />}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteItem(item.$id);
                                          }}
                                        >
                                          <Trash2Icon className="size-3" />
                                        </Button>
                                      </div>
                                      {item.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                                          {item.priority}
                                        </Badge>
                                        {item.estimatedHours && (
                                          <Badge variant="outline" className="text-xs">
                                            <ClockIcon className="size-3 mr-1" />
                                            {item.estimatedHours}h
                                          </Badge>
                                        )}
                                        {item.dueDate && (
                                          <Badge variant="outline" className="text-xs">
                                            <CalendarIcon className="size-3 mr-1" />
                                            {new Date(item.dueDate).toLocaleDateString()}
                                          </Badge>
                                        )}
                                      </div>
                                      {item.labels && item.labels.length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                          {item.labels.map((label, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {label}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {/* Add Item Button */}
                          <Button
                            onClick={() => {
                              setNewItemTitle("");
                              // You can add modal open logic here if needed
                            }}
                            variant="ghost"
                            className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-100 mt-2"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </>
  );
};
