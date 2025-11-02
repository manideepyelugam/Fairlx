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
import { Separator } from "@/components/ui/separator";

import { useGetWorkItems } from "../api/use-get-work-items";
import { useGetEpics } from "../api/use-get-epics";
import { CreateWorkItemBar } from "./create-work-item-bar";
import { WorkItemCard } from "./work-item-card";
import { EpicCard } from "./epic-card";
import { CreateEpicDialog } from "./create-epic-dialog";
import { EpicPanel } from "./epic-panel";
import { FiltersPanel } from "./filters-panel";
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
  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`expandedEpics_${projectId}`) : null;
    return saved ? new Set(JSON.parse(saved)) : new Set(["none"]); // Default expand "none"
  });
  const [showEpicPanel, setShowEpicPanel] = useState(false);
  const [groupByEpic, setGroupByEpic] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

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

  const handleEpicSelect = (epicId: string | null) => {
    setSelectedEpicId(epicId);
  };

  // Get work items by epic
  const getWorkItemsByEpic = (epicId: string) => {
    return workItems.filter((item) => item.epicId === epicId);
  };

  // Toggle panels mutually exclusive
  const toggleEpicPanel = () => {
    if (!showEpicPanel) {
      setShowFiltersPanel(false); // Close filters if opening epic
    }
    setShowEpicPanel(!showEpicPanel);
  };

  const toggleFiltersPanel = () => {
    if (!showFiltersPanel) {
      setShowEpicPanel(false); // Close epic if opening filters
    }
    setShowFiltersPanel(!showFiltersPanel);
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

      {/* Filters Panel Sidebar */}
      {showFiltersPanel && (
        <FiltersPanel
          typeFilter={typeFilter}
          priorityFilter={priorityFilter}
          statusFilter={statusFilter}
          selectedEpicId={selectedEpicId}
          epics={epics}
          onTypeChange={setTypeFilter}
          onPriorityChange={setPriorityFilter}
          onStatusChange={setStatusFilter}
          onEpicChange={setSelectedEpicId}
          onClearAll={clearFilters}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col   min-h-[83vh]  overflow-hidden">{/* Header */}
        <div className="   mb-6 ">
          <div className="px-6 ">
            <div className="flex items-start justify-between mb-4">
               <div className="mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">Backlog</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Manage unscheduled work items and plan future sprints</p>
          </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleEpicPanel}
                  className="text-xs font-medium !py-5.5"
                >
                  <Layers className="!size-3 mr-0" />
                  {showEpicPanel ? "Hide" : "Show"} Epic Panel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {}}
                  className="text-xs font-medium !py-5.5 tracking-normal bg-primary"
                >
                  <Plus className="!size-3 mr-0" />
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
                className="pl-9 text-xs !h-10"
              />
            </div>

            {/* Epic Filter Dropdown */}
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
              <SelectTrigger className="w-[180px] !text-xs ">
                <SelectValue placeholder="All Epics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-xs" value="all">All Epics</SelectItem>
                <Separator />
                <SelectItem className="text-xs" value="none">
                  <div className="flex items-center gap-x-2">
                    <Layers className="size-[18px] text-gray-400" />
                    No Epic
                  </div>
                </SelectItem>
                {epics.length > 0 && epics.map((epic) => (
                  <SelectItem key={epic.$id} className="text-xs" value={epic.$id}>
                    <div className="flex items-center gap-x-2">
                      <Layers className="size-[18px] text-purple-500" />
                      <span className="truncate">{epic.title}</span>
                    </div>
                  </SelectItem>
                ))}
                <Separator />
                <SelectItem className="text-xs" value="__create_new__">
                  <div className="flex items-center gap-x-2 text-primary">
                    <Plus className="size-[18px]" />
                    Create Epic
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFiltersPanel}
              className="text-xs font-normal  !h-10"
            >
              <SlidersHorizontal className="!size-3 mr-0" />
              {showFiltersPanel ? "Hide" : "Show"} Filters
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="!text-xs !h-10 !font-normal">
                  <Filter className="!size-3 !font-normal mr-0" />
                  Quick Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem className="text-xs">
                  <div className="flex items-center gap-x-2">
                    <Layers className="size-[18px] text-blue-500" />
                    Assigned to me
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-xs">
                  <div className="flex items-center gap-x-2">
                    <Layers className="size-[18px] text-yellow-500" />
                    Flagged
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-xs">
                  <div className="flex items-center gap-x-2">
                    <Layers className="size-[18px] text-gray-400" />
                    Without epic
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem className="text-xs">
                  <div className="flex items-center gap-x-2">
                    <Layers className="size-[18px] text-red-500" />
                    High priority
                  </div>
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>


          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4 max-w-6xl mx-auto">
          {/* Stats Bar */}
         

          {/* Tabbed View */}
          <Tabs defaultValue="items" className="space-y-4">
            <TabsList className="mb-3">
              <TabsTrigger value="items" className="text-xs py-2 px-4">
                Work Items ({nonEpicWorkItems.length})
              </TabsTrigger>
              <TabsTrigger value="epics" className="text-xs py-2 px-4">
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
                    className="shrink-0 text-xs font-normal "
                  >
                    <Layers className="size-3 mr-0" />
                    {groupByEpic ? "Ungroup" : "Group by Epic"}
                  </Button>
                </div>

               
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
                  <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                    {nonEpicWorkItems.map((workItem) => (
                      <div
                        key={workItem.$id}
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
