"use client";

import { useState, useCallback, useMemo } from "react";
import { PlusIcon, Loader2, SearchIcon, FlagIcon, ClockIcon, CalendarIcon, Trash2Icon, MoreHorizontalIcon, CircleDashedIcon, CircleDotDashedIcon, CircleCheckIcon, Edit2Icon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useConfirm } from "@/hooks/use-confirm";

import { useGetBacklogItems } from "../api/use-get-backlog-items";
import { useCreateBacklogItem } from "../api/use-create-backlog-item";
import { useDeleteBacklogItem } from "../api/use-delete-backlog-item";
import { useBulkUpdateBacklogItems } from "../api/use-bulk-update-backlog-items";
import { BacklogItemType, BacklogItemPriority, BacklogItemStatus, BacklogItem } from "../types";
import { CreateBacklogItemDialog } from "./create-backlog-item-dialog";
import { EditBacklogItemDialog } from "./edit-backlog-item-dialog";
import { BacklogPriorityBadge } from "./backlog-priority-badge";
import { BacklogLabelBadge } from "./backlog-label-badge";
import { BacklogTypeBadge } from "./backlog-type-badge";

interface MyBacklogViewProps {
  workspaceId: string;
}

export const MyBacklogView = ({ workspaceId }: MyBacklogViewProps) => {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BacklogItemStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<BacklogItemPriority | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<BacklogItemType | "ALL">("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogStatus, setCreateDialogStatus] = useState<BacklogItemStatus>(BacklogItemStatus.TODO);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);

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
              placeholder="Quick add (or click '+' for details)..."
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
            <Button onClick={handleCreateItem} disabled={isCreating || !newItemTitle.trim()} variant="outline">
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
              Quick Add
            </Button>
            <Button onClick={() => {
              setCreateDialogStatus(BacklogItemStatus.TODO);
              setCreateDialogOpen(true);
            }}>
              <PlusIcon className="size-4 mr-2" />
              New Item
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
                                  <div 
                                    onClick={() => setEditingItem(item)}
                                    className={`bg-white mb-2.5 rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                                      snapshot.isDragging ? "shadow-lg rotate-2 opacity-90" : ""
                                    }`}
                                  >
                                    <div className="flex p-4 flex-col items-start justify-between gap-x-2">
                                      {/* Top Section - Badges and Actions */}
                                      <div className="flex-1 flex w-full justify-between">
                                        <div className="flex gap-2 flex-wrap">
                                          <BacklogPriorityBadge priority={item.priority} />
                                          <BacklogTypeBadge type={item.type} />
                                          {item.flagged && (
                                            <FlagIcon className="size-4 text-red-500 fill-red-500" />
                                          )}
                                          {item.labels && item.labels.length > 0 && (
                                            <>
                                              {item.labels.slice(0, 2).map((label, index) => (
                                                <BacklogLabelBadge key={index} label={label} />
                                              ))}
                                              {item.labels.length > 2 && (
                                                <span className="text-[10px] text-muted-foreground self-center">
                                                  +{item.labels.length - 2}
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingItem(item);
                                            }}
                                          >
                                            <Edit2Icon className="size-[16px] stroke-1 text-neutral-700 hover:opacity-75 transition" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteItem(item.$id);
                                            }}
                                          >
                                            <Trash2Icon className="size-[16px] stroke-1 text-neutral-700 hover:text-destructive hover:opacity-75 transition" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Title */}
                                      <h1 className="text-sm line-clamp-2 mt-4 font-semibold flex-1">
                                        {item.title}
                                      </h1>

                                      {/* Description */}
                                      {item.description && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                                          {(() => {
                                            const words = item.description.split(/\s+/);
                                            const shouldEllipsize = words.length > 5 || words.some((w) => w.length > 20);
                                            const preview = words
                                              .slice(0, 5)
                                              .map((word) => (word.length > 20 ? word.slice(0, 20) + "..." : word))
                                              .join(" ");
                                            return preview + (shouldEllipsize ? "....." : "");
                                          })()}
                                        </p>
                                      )}
                                    </div>

                                    {/* Bottom Section - Date and Time Info */}
                                    <div className="flex items-center border-t py-3 px-4 border-gray-200 gap-x-1.5 justify-between">
                                      <div className="flex items-center gap-2">
                                        {item.dueDate && (
                                          <p className="text-xs flex gap-0.5 items-center text-muted-foreground">
                                            <CalendarIcon className="size-[14px] inline-block mr-1 text-gray-500" />
                                            {new Date(item.dueDate)
                                              .toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                              })
                                              .replace(/ /g, "-")}
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-x-2">
                                        {item.estimatedHours && (
                                          <p className="text-xs flex items-center text-muted-foreground">
                                            <ClockIcon className="size-[14px] mr-1 text-gray-500" />
                                            {item.estimatedHours}h
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {/* Add Item Button */}
                          <Button
                            onClick={() => {
                              setCreateDialogStatus(status as BacklogItemStatus);
                              setCreateDialogOpen(true);
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

        {/* Dialogs */}
        <CreateBacklogItemDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          workspaceId={workspaceId}
          defaultStatus={createDialogStatus}
        />
        
        {editingItem && (
          <EditBacklogItemDialog
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
            item={editingItem}
          />
        )}
      </div>
    </>
  );
};
