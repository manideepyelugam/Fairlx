import { useState, useCallback, useMemo } from "react";
import { TimelineFilters, TimelineZoomLevel, DragState } from "../types";

const defaultFilters: TimelineFilters = {
  search: "",
  epicId: null,
  type: "ALL",
  label: null,
  status: "ALL",
  sprintId: null,
};

const defaultDragState: DragState = {
  isDragging: false,
  itemId: null,
  type: null,
  startX: 0,
  currentX: 0,
};

export function useTimelineState() {
  // Filters
  const [filters, setFiltersState] = useState<TimelineFilters>(defaultFilters);

  const setFilters = useCallback((newFilters: Partial<TimelineFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  // Zoom level
  const [zoomLevel, setZoomLevel] = useState<TimelineZoomLevel>(TimelineZoomLevel.WEEKS);

  // Selection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  // Expansion state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback((allIds: string[]) => {
    setExpandedItems(new Set(allIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  const setExpanded = useCallback((ids: string[]) => {
    setExpandedItems(new Set(ids));
  }, []);

  // Drag state
  const [dragState, setDragStateValue] = useState<DragState>(defaultDragState);

  const setDragState = useCallback((newState: Partial<DragState>) => {
    setDragStateValue((prev) => ({ ...prev, ...newState }));
  }, []);

  const resetDragState = useCallback(() => {
    setDragStateValue(defaultDragState);
  }, []);

  // Scroll position
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // Current date (for "Today" marker)
  const currentDate = useMemo(() => new Date(), []);

  return {
    // Filters
    filters,
    setFilters,
    resetFilters,

    // Zoom level
    zoomLevel,
    setZoomLevel,

    // Selection
    selectedItemId,
    setSelectedItemId,
    selectedItems,
    toggleItemSelection,
    clearSelection,
    selectMultiple,

    // Expansion state
    expandedItems,
    toggleExpanded,
    expandAll,
    collapseAll,
    setExpanded,

    // Drag state
    dragState,
    setDragState,
    resetDragState,

    // Scroll position
    scrollPosition,
    setScrollPosition,

    // Current date
    currentDate,
  };
}

export type TimelineState = ReturnType<typeof useTimelineState>;

