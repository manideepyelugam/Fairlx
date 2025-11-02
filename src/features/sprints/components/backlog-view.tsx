"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, SlidersHorizontal, Plus, Layers, ChevronDown, ChevronRight, X } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useGetWorkItems } from "../api/use-get-work-items";
import { useGetEpics } from "../api/use-get-epics";
import { CreateWorkItemBar } from "./create-work-item-bar";
import { WorkItemCard } from "./work-item-card";
import { EpicCard } from "./epic-card";
import { CreateEpicDialog } from "./create-epic-dialog";
import { EpicPanel } from "./epic-panel";
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
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null); // null = all, "none" = no epic, or epicId
  const [showFilters, setShowFilters] = useState(false);
  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`expandedEpics_${projectId}`) : null;
    return saved ? new Set(JSON.parse(saved)) : new Set(["none"]); // Default expand "none"
  });
  const [showEpicPanel, setShowEpicPanel] = useState(true);
  const [groupByEpic, setGroupByEpic] = useState(false);

  // Persist expanded epics
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`expandedEpics_${projectId}`, JSON.stringify([...expandedEpics]));
    }
  }, [expandedEpics, projectId]);

  const { data: workItemsData, isLoading } = useGetWorkItems({
    workspaceId,
    projectId,
    sprintId: null, // Only unassigned items
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    epicId: selectedEpicId === "none" ? null : selectedEpicId !== null ? selectedEpicId : undefined,
    search: search || undefined,
    includeChildren: true,
  });

  const { data: epicsData } = useGetEpics({ workspaceId, projectId });

  const workItems = useMemo(() => workItemsData?.documents || [], [workItemsData?.documents]);
  const epics = epicsData?.documents || [];

  // Memoize filtered work items
  const nonEpicWorkItems = useMemo(() => 
    workItems.filter((item) => item.type !== WorkItemType.EPIC && !item.epicId),
    [workItems]
  );
  
  // Memoize grouped work items by epic
  const workItemsByEpic = useMemo(() => {
    return nonEpicWorkItems.reduce((acc, item) => {
      const epicId = item.epicId || "none";
      if (!acc[epicId]) {
        acc[epicId] = [];
      }
      acc[epicId].push(item);
      return acc;
    }, {} as Record<string, typeof nonEpicWorkItems>);
  }, [nonEpicWorkItems]);
  
  const workItemsWithoutEpic = workItemsByEpic["none"] || [];

  const activeFilterCount = useMemo(() => [
    typeFilter !== "ALL",
    priorityFilter !== "ALL",
    statusFilter !== "ALL",
    selectedEpicId !== null,
    search !== "",
  ].filter(Boolean).length, [typeFilter, priorityFilter, statusFilter, selectedEpicId, search]);

  const clearFilters = () => {
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setSelectedEpicId(null);
    setSearch("");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + E: Create Epic
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setCreateEpicOpen(true);
      }
      // Ctrl/Cmd + G: Toggle Group View
      else if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setGroupByEpic(prev => !prev);
      }
      // Ctrl/Cmd + \: Toggle Epic Panel
      else if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setShowEpicPanel(prev => !prev);
      }
      // Escape: Clear filters or close dialogs
      else if (e.key === 'Escape' && activeFilterCount > 0) {
        clearFilters();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilterCount]);

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

  // Get work items by epic
  const getWorkItemsByEpic = (epicId: string) => {
    return workItems.filter((item) => item.epicId === epicId);
  };

  const handleEpicSelect = (epicId: string | null) => {
    setSelectedEpicId(epicId);
  };

  return (
    <div className="flex h-full">
      {/* Epic Panel Sidebar */}
      {showEpicPanel && (
        <EpicPanel
          epics={epics}
          workItems={workItems}
          selectedEpicId={selectedEpicId}
          onEpicSelect={handleEpicSelect}
          onCreateEpic={() => setCreateEpicOpen(true)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Backlog</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage unscheduled work items and plan future sprints
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowEpicPanel(!showEpicPanel)}
                >
                  <Layers className="size-4 mr-2" />
                  {showEpicPanel ? "Hide" : "Show"} Epic Panel
                </Button>
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

            {/* Epic Filter Dropdown - Jira Style */}
            <Select
              value={selectedEpicId || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedEpicId(null);
                } else if (value === "__create_new__") {
                  setCreateEpicOpen(true);
                } else {
                  setSelectedEpicId(value);
                }
              }}
            >
              <SelectTrigger className="w-[200px] bg-background">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-purple-600" />
                  <SelectValue>
                    {selectedEpicId === "none" ? (
                      "Issues without epic"
                    ) : selectedEpicId ? (
                      <span className="truncate">
                        {epics.find(e => e.$id === selectedEpicId)?.title || "Epic"}
                      </span>
                    ) : (
                      "All Epics"
                    )}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">All Epics</span>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-400" />
                    <span>Issues without epic</span>
                  </div>
                </SelectItem>
                {epics.length > 0 && (
                  <>
                    {epics.map((epic) => (
                      <SelectItem key={epic.$id} value={epic.$id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-purple-500" />
                          <span className="truncate">{epic.title}</span>
                          <span className="text-xs text-muted-foreground">({epic.key})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="__create_new__">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Plus className="size-3.5" />
                    <span>Create epic</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

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
                    value={selectedEpicId || "ALL"}
                    onValueChange={(value) => setSelectedEpicId(value === "ALL" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Epics</SelectItem>
                      <SelectItem value="none">No Epic</SelectItem>
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
        <div className="px-6 py-4 max-w-6xl mx-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="bg-card border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground">Total Items</p>
              <p className="text-xl font-bold mt-0.5">{workItems.length}</p>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground">Story Points</p>
              <p className="text-xl font-bold mt-0.5">
                {workItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0)}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground">High Priority</p>
              <p className="text-xl font-bold mt-0.5">
                {workItems.filter((item) => 
                  item.priority === WorkItemPriority.HIGH || 
                  item.priority === WorkItemPriority.URGENT
                ).length}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground">Flagged</p>
              <p className="text-xl font-bold mt-0.5">
                {workItems.filter((item) => item.flagged).length}
              </p>
            </div>
          </div>

          {/* Tabbed View */}
          <Tabs defaultValue="items" className="space-y-4">
            <TabsList>
              <TabsTrigger value="items" className="text-sm">
                Work Items ({nonEpicWorkItems.length})
              </TabsTrigger>
              <TabsTrigger value="epics" className="text-sm">
                <Layers className="size-3.5 mr-1.5" />
                Epics ({epics.length})
              </TabsTrigger>
            </TabsList>

            {/* Work Items Tab */}
            <TabsContent value="items" className="space-y-4">
              {/* View Options & Quick Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CreateWorkItemBar
                    workspaceId={workspaceId}
                    projectId={projectId}
                    sprintId={null}
                    onCreateEpic={() => setCreateEpicOpen(true)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupByEpic(!groupByEpic)}
                    className="shrink-0"
                  >
                    <Layers className="size-3.5 mr-1.5" />
                    {groupByEpic ? "Ungroup" : "Group by Epic"}
                  </Button>
                </div>

                {/* Active Filters */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center gap-2 flex-wrap p-2.5 bg-muted/50 rounded-lg border">
                    <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
                    {typeFilter !== "ALL" && (
                      <Badge variant="secondary" className="gap-1.5 h-6">
                        Type: {typeFilter}
                        <X 
                          className="size-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setTypeFilter("ALL")} 
                        />
                      </Badge>
                    )}
                    {priorityFilter !== "ALL" && (
                      <Badge variant="secondary" className="gap-1.5 h-6">
                        Priority: {priorityFilter}
                        <X 
                          className="size-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setPriorityFilter("ALL")} 
                        />
                      </Badge>
                    )}
                    {statusFilter !== "ALL" && (
                      <Badge variant="secondary" className="gap-1.5 h-6">
                        Status: {statusFilter.replace("_", " ")}
                        <X 
                          className="size-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setStatusFilter("ALL")} 
                        />
                      </Badge>
                    )}
                    {selectedEpicId && (
                      <Badge variant="secondary" className="gap-1.5 h-6">
                        Epic: {selectedEpicId === "none" ? "No Epic" : epics.find(e => e.$id === selectedEpicId)?.key || "Selected"}
                        <X 
                          className="size-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setSelectedEpicId(null)} 
                        />
                      </Badge>
                    )}
                    {search && (
                      <Badge variant="secondary" className="gap-1.5 h-6">
                        Search: &quot;{search.substring(0, 20)}{search.length > 20 ? "..." : ""}&quot;
                        <X 
                          className="size-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setSearch("")} 
                        />
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 ml-auto text-xs"
                      onClick={clearFilters}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              {/* Work Items List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading backlog...</p>
                  </div>
                </div>
              ) : nonEpicWorkItems.length > 0 ? (
                groupByEpic ? (
                  <div className="space-y-4">
                    {/* Issues without epic */}
                    {workItemsWithoutEpic.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 py-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleEpicExpand("none")}
                          >
                            {expandedEpics.has("none") ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </Button>
                          <div className="w-2.5 h-2.5 rounded bg-gray-400" />
                          <h3 className="font-semibold text-sm">Issues without epic</h3>
                          <Badge variant="secondary" className="text-xs h-5">
                            {workItemsWithoutEpic.length}
                          </Badge>
                        </div>
                        {expandedEpics.has("none") && (
                          <div className="ml-7 space-y-2">
                            {workItemsWithoutEpic.map((workItem) => (
                              <WorkItemCard
                                key={workItem.$id}
                                workItem={workItem}
                                workspaceId={workspaceId}
                                projectId={projectId}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Epics with their work items */}
                    {epics.map((epic) => {
                      const epicWorkItems = workItemsByEpic[epic.$id] || [];
                      if (epicWorkItems.length === 0) return null;

                      return (
                        <div key={epic.$id} className="space-y-2">
                          <div className="flex items-center gap-2 py-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleEpicExpand(epic.$id)}
                            >
                              {expandedEpics.has(epic.$id) ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </Button>
                            <div className="w-2.5 h-2.5 rounded bg-purple-500" />
                            <h3 className="font-semibold text-sm truncate">{epic.title}</h3>
                            <Badge variant="outline" className="text-xs h-5 text-purple-700 border-purple-300">
                              {epic.key}
                            </Badge>
                            <Badge variant="secondary" className="text-xs h-5">
                              {epicWorkItems.length}
                            </Badge>
                          </div>
                          {expandedEpics.has(epic.$id) && (
                            <div className="ml-7 space-y-2">
                              {epicWorkItems.map((workItem) => (
                                <WorkItemCard
                                  key={workItem.$id}
                                  workItem={workItem}
                                  workspaceId={workspaceId}
                                  projectId={projectId}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nonEpicWorkItems.map((workItem) => (
                      <div
                        key={workItem.$id}
                        className="transform transition-all duration-200 hover:scale-[1.01]"
                      >
                        <WorkItemCard 
                          workItem={workItem} 
                          workspaceId={workspaceId}
                          projectId={projectId}
                        />
                      </div>
                    ))}
                  </div>
                )
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
            </TabsContent>

            {/* Epics Tab */}
            <TabsContent value="epics" className="space-y-6">
              {/* Create Epic Button */}
              <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-purple-900">Manage Epics</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Organize work items into large bodies of work
                  </p>
                </div>
                <Button
                  onClick={() => setCreateEpicOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="size-4 mr-2" />
                  Create Epic
                </Button>
              </div>

              {/* Epics List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading epics...</p>
                  </div>
                </div>
              ) : epics.length > 0 ? (
                <div className="space-y-4">
                  {epics.map((epic) => (
                    <EpicCard
                      key={epic.$id}
                      epic={epic}
                      workspaceId={workspaceId}
                      childWorkItems={getWorkItemsByEpic(epic.$id)}
                      isExpanded={expandedEpics.has(epic.$id)}
                      onToggleExpand={() => toggleEpicExpand(epic.$id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card border rounded-lg">
                  <div className="max-w-md mx-auto">
                    <div className="size-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="size-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No epics yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first epic to organize related work items
                    </p>
                    <Button onClick={() => setCreateEpicOpen(true)} variant="outline">
                      <Plus className="size-4 mr-2" />
                      Create Epic
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Create Epic Dialog */}
          <CreateEpicDialog
            open={createEpicOpen}
            onClose={() => setCreateEpicOpen(false)}
            workspaceId={workspaceId}
            projectId={projectId}
          />
        </div>
      </div>
      </div>
    </div>
  );
};
