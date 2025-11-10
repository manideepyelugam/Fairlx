"use client";

import React, { useMemo, useRef, useCallback } from "react";
import { useTimelineState } from "@/features/timeline/hooks/use-timeline-store";
import { useGetTimelineData } from "@/features/timeline/api/use-get-timeline-data";
import { useUpdateTimelineItem } from "@/features/timeline/api/use-update-timeline-item";
import { TimelineHeader } from "@/features/timeline/components/timeline-header";
import { TimelineWorkTree } from "@/features/timeline/components/timeline-work-tree";
import { TimelineGrid } from "@/features/timeline/components/timeline-grid";
import { TimelineDetailsPanel } from "@/features/timeline/components/timeline-details-panel";
import {
  groupItemsBySprintAndEpic,
  filterTimelineItems,
  flattenTimelineItems,
  calculateTimelineRange,
  extractLabels,
  workItemToTimelineItem,
  dateToPixel,
} from "@/features/timeline/utils";
import {
  TimelineGridConfig,
  TimelineItem,
  ZOOM_CONFIGS,
} from "@/features/timeline/types";
import { WorkItemType } from "@/features/sprints/types";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

export default function TimelinePage() {
  const workspaceId = useWorkspaceId();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State management
  const timelineState = useTimelineState();
  const {
    filters,
    setFilters,
    resetFilters,
    zoomLevel,
    setZoomLevel,
    selectedItemId,
    setSelectedItemId,
    expandedItems,
    toggleExpanded,
    collapseAll,
    setExpanded,
  } = timelineState;

  // Fetch data
  const { data, isLoading, error } = useGetTimelineData({ workspaceId });
  const { mutate: updateItem } = useUpdateTimelineItem();

  // Auto-expand all sprints and unscheduled items on initial load
  React.useEffect(() => {
    const sprints = data?.sprints?.documents || [];
    const workItems = data?.workItems?.documents || [];
    
    if (sprints.length >= 0 && workItems.length >= 0 && expandedItems.size === 0) {
      const sprintIds = sprints.map((s) => (s as { $id: string }).$id);
      const noEpicGroups = ['unscheduled', 'no-epic-unscheduled', ...sprintIds.map((id: string) => `no-epic-${id}`)];
      setExpanded([...sprintIds, ...noEpicGroups]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.sprints, data?.workItems]);

  // Convert work items to timeline items
  const allTimelineItems = useMemo(() => {
    const workItems = data?.workItems?.documents || [];
    if (workItems.length === 0) return [];
    return workItems.map((item) =>
      workItemToTimelineItem(item as never, 0, expandedItems)
    );
  }, [data?.workItems, expandedItems]);

  // Group by sprints and epics
  const sprintGroups = useMemo(() => {
    const sprints = data?.sprints?.documents || [];
    const workItems = data?.workItems?.documents || [];
    
    if (sprints.length === 0 && workItems.length === 0) return [];
    
    const groups = groupItemsBySprintAndEpic(
      sprints as never,
      workItems as never,
      expandedItems
    );
    
    return groups;
  }, [data?.sprints, data?.workItems, expandedItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return filterTimelineItems(allTimelineItems, filters);
  }, [allTimelineItems, filters]);

  // Flatten for grid rendering
  const flatItems = useMemo(() => {
    return flattenTimelineItems(sprintGroups);
  }, [sprintGroups]);

  // Get epics for filter dropdown
  const epics = useMemo(() => {
    return allTimelineItems.filter((item: TimelineItem) => item.type === WorkItemType.EPIC);
  }, [allTimelineItems]);

  // Get all labels
  const labels = useMemo(() => {
    return extractLabels(allTimelineItems);
  }, [allTimelineItems]);

  // Calculate timeline range and grid config
  const gridConfig: TimelineGridConfig = useMemo(() => {
    const range = calculateTimelineRange(filteredItems, zoomLevel);
    const config = ZOOM_CONFIGS[zoomLevel];

    return {
      dayWidth: config.dayWidth,
      rowHeight: 48,
      headerHeight: 60,
      minDate: range.startDate,
      maxDate: range.endDate,
    };
  }, [filteredItems, zoomLevel]);

  // Get selected item details
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return allTimelineItems.find((item: TimelineItem) => item.id === selectedItemId) || null;
  }, [selectedItemId, allTimelineItems]);

  // Check if all items are expanded
  const allExpanded = useMemo(() => {
    const allExpandableIds = [
      ...(data?.sprints?.documents || []).map((s) => (s as { $id: string }).$id),
      ...allTimelineItems.map((i: TimelineItem) => i.id),
    ];
    return allExpandableIds.every(id => expandedItems.has(id));
  }, [data, allTimelineItems, expandedItems]);

  // Handlers
  const handleToggleExpandAll = useCallback(() => {
    if (allExpanded) {
      collapseAll();
    } else {
      const allIds = [
        ...(data?.sprints?.documents || []).map((s) => (s as { $id: string }).$id),
        ...allTimelineItems.map((i: TimelineItem) => i.id),
      ];
      setExpanded(allIds);
    }
  }, [allExpanded, data, allTimelineItems, setExpanded, collapseAll]);

  const handleCenterToday = useCallback(() => {
    if (scrollContainerRef.current) {
      const todayX = dateToPixel(new Date(), gridConfig);
      scrollContainerRef.current.scrollLeft =
        todayX - scrollContainerRef.current.clientWidth / 2;
    }
  }, [gridConfig]);

  const handleItemUpdate = useCallback(
    (itemId: string, updates: Record<string, unknown>) => {
      updateItem({ 
        param: { workItemId: itemId },
        json: updates 
      });
    },
    [updateItem]
  );

  // Loading and error states
  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <PageError message="Failed to load timeline data" />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <TimelineHeader
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={resetFilters}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onToggleExpandAll={handleToggleExpandAll}
        allExpanded={allExpanded}
        onCenterToday={handleCenterToday}
        epics={epics}
        labels={labels}
        allItems={flatItems}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Work Tree Sidebar */}
        <TimelineWorkTree
          sprintGroups={sprintGroups}
          selectedItemId={selectedItemId}
          onItemClick={setSelectedItemId}
          onToggleExpanded={toggleExpanded}
        />

        {/* Timeline Grid */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-muted/10"
        >
          <TimelineGrid
            items={flatItems}
            gridConfig={gridConfig}
            zoomLevel={zoomLevel}
            selectedItemId={selectedItemId}
            onItemClick={setSelectedItemId}
            onItemUpdate={handleItemUpdate}
            scrollContainerRef={scrollContainerRef}
          />
        </div>

        {/* Details Panel */}
        {selectedItem && (
          <TimelineDetailsPanel
            item={selectedItem}
            onClose={() => setSelectedItemId(null)}
            onUpdate={handleItemUpdate}
          />
        )}
      </div>
    </div>
  );
}
