"use client";

import { useState } from "react";
import { PlusIcon, Loader2, SearchIcon, FlagIcon, ClockIcon, CalendarIcon, Trash2Icon } from "lucide-react";
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

  const items = data?.documents ?? [];

  // Group items by status
  const groupedItems = {
    [BacklogItemStatus.TODO]: items.filter((item) => item.status === BacklogItemStatus.TODO),
    [BacklogItemStatus.IN_PROGRESS]: items.filter((item) => item.status === BacklogItemStatus.IN_PROGRESS),
    [BacklogItemStatus.DONE]: items.filter((item) => item.status === BacklogItemStatus.DONE),
  };

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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStatus = source.droppableId as BacklogItemStatus;
    const destStatus = destination.droppableId as BacklogItemStatus;

    const sourceItems = [...groupedItems[sourceStatus]];
    const destItems = sourceStatus === destStatus ? sourceItems : [...groupedItems[destStatus]];

    const [movedItem] = sourceItems.splice(source.index, 1);

    if (sourceStatus === destStatus) {
      sourceItems.splice(destination.index, 0, movedItem);
    } else {
      destItems.splice(destination.index, 0, movedItem);
    }

    const updatesToMake = sourceStatus === destStatus
      ? sourceItems.map((item, idx) => ({
          $id: item.$id,
          status: sourceStatus,
          position: (idx + 1) * 1000,
        }))
      : [
          ...sourceItems.map((item, idx) => ({
            $id: item.$id,
            status: sourceStatus,
            position: (idx + 1) * 1000,
          })),
          ...destItems.map((item, idx) => ({
            $id: item.$id,
            status: destStatus,
            position: (idx + 1) * 1000,
          })),
        ];

    bulkUpdate({ items: updatesToMake });
  };

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              {Object.entries(groupedItems).map(([status, items]) => (
                <div key={status} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      {status === BacklogItemStatus.TODO && "To Do"}
                      {status === BacklogItemStatus.IN_PROGRESS && "In Progress"}
                      {status === BacklogItemStatus.DONE && "Done"}
                      <span className="ml-2 text-xs">({items.length})</span>
                    </h3>
                  </div>
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-2 p-2 rounded-lg border-2 border-dashed transition-colors ${
                          snapshot.isDraggingOver ? "bg-muted/50 border-primary" : "border-transparent"
                        }`}
                      >
                        {items.map((item, index) => (
                          <Draggable key={item.$id} draggableId={item.$id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 cursor-move hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                                      <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                                      {item.flagged && <FlagIcon className="size-3 text-red-500" />}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => handleDeleteItem(item.$id)}
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {items.length === 0 && (
                          <div className="text-center text-sm text-muted-foreground py-8">
                            No items
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </>
  );
};
