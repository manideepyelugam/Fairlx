"use client";

import { useState } from "react";
import { Search, Filter, SlidersHorizontal, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useGetWorkItems } from "../api/use-get-work-items";
import { useGetEpics } from "../api/use-get-epics";
import { CreateWorkItemBar } from "./create-work-item-bar";
import { WorkItemCard } from "./work-item-card";
import {
  WorkItemType,
  WorkItemStatus,
  WorkItemPriority,
} from "../types";

interface BacklogViewProps {
  workspaceId: string;
  projectId: string;
}

export const BacklogView = ({ workspaceId, projectId }: BacklogViewProps) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<WorkItemType | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<WorkItemPriority | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<WorkItemStatus | "ALL">("ALL");
  const [epicFilter, setEpicFilter] = useState<string | "ALL">("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const { data: workItemsData, isLoading } = useGetWorkItems({
    workspaceId,
    projectId,
    sprintId: null, // Only unassigned items
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    epicId: epicFilter !== "ALL" ? epicFilter : undefined,
    search: search || undefined,
    includeChildren: true,
  });

  const { data: epicsData } = useGetEpics({ workspaceId, projectId });

  const workItems = workItemsData?.documents || [];
  const epics = epicsData?.documents || [];

  const activeFilterCount = [
    typeFilter !== "ALL",
    priorityFilter !== "ALL",
    statusFilter !== "ALL",
    epicFilter !== "ALL",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setEpicFilter("ALL");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Backlog</h1>
              <p className="text-muted-foreground mt-2">
                Manage unscheduled work items and plan future sprints
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="shadow-md"
              onClick={() => {}}
            >
              <Plus className="size-4 mr-2" />
              Plan Sprint
            </Button>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search work items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <Button
              variant="outline"
              size="default"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <SlidersHorizontal className="size-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <Filter className="size-4 mr-2" />
                  Quick Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Show items</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>
                  Assigned to me
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Flagged
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Without epic
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  High priority
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Type
                  </label>
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value as WorkItemType | "ALL")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value={WorkItemType.STORY}>Story</SelectItem>
                      <SelectItem value={WorkItemType.BUG}>Bug</SelectItem>
                      <SelectItem value={WorkItemType.TASK}>Task</SelectItem>
                      <SelectItem value={WorkItemType.EPIC}>Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Priority
                  </label>
                  <Select
                    value={priorityFilter}
                    onValueChange={(value) => setPriorityFilter(value as WorkItemPriority | "ALL")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Priorities</SelectItem>
                      <SelectItem value={WorkItemPriority.LOW}>Low</SelectItem>
                      <SelectItem value={WorkItemPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={WorkItemPriority.HIGH}>High</SelectItem>
                      <SelectItem value={WorkItemPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as WorkItemStatus | "ALL")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value={WorkItemStatus.TODO}>To Do</SelectItem>
                      <SelectItem value={WorkItemStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={WorkItemStatus.IN_REVIEW}>In Review</SelectItem>
                      <SelectItem value={WorkItemStatus.DONE}>Done</SelectItem>
                      <SelectItem value={WorkItemStatus.BLOCKED}>Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Epic
                  </label>
                  <Select
                    value={epicFilter}
                    onValueChange={setEpicFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Epics</SelectItem>
                      {epics.map((epic) => (
                        <SelectItem key={epic.$id} value={epic.$id}>
                          {epic.key}: {epic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6 max-w-6xl mx-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold mt-1">{workItems.length}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground">Story Points</p>
              <p className="text-2xl font-bold mt-1">
                {workItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0)}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold mt-1">
                {workItems.filter((item) => 
                  item.priority === WorkItemPriority.HIGH || 
                  item.priority === WorkItemPriority.URGENT
                ).length}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground">Flagged</p>
              <p className="text-2xl font-bold mt-1">
                {workItems.filter((item) => item.flagged).length}
              </p>
            </div>
          </div>

          {/* Create Work Item */}
          <div className="mb-6">
            <CreateWorkItemBar
              workspaceId={workspaceId}
              projectId={projectId}
              sprintId={null}
            />
          </div>

          {/* Work Items List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading backlog...</p>
              </div>
            </div>
          ) : workItems.length > 0 ? (
            <div className="space-y-3">
              {workItems.map((workItem) => (
                <div
                  key={workItem.$id}
                  className="transform transition-all duration-200 hover:scale-[1.01]"
                >
                  <WorkItemCard workItem={workItem} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border rounded-lg">
              <div className="max-w-md mx-auto">
                <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {search || activeFilterCount > 0 ? "No items found" : "Backlog is empty"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search || activeFilterCount > 0
                    ? "Try adjusting your search or filters"
                    : "Create your first work item to get started"}
                </p>
                {(search || activeFilterCount > 0) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      clearFilters();
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
