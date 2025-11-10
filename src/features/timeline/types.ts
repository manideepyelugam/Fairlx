import { WorkItemType, WorkItemStatus, WorkItemPriority, PopulatedSprint } from "../sprints/types";

export enum TimelineZoomLevel {
  TODAY = "TODAY",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
  QUARTERS = "QUARTERS",
}

export type TimelineFilters = {
  search: string;
  epicId?: string | null;
  type?: WorkItemType | "ALL";
  label?: string | null;
  status?: WorkItemStatus | "ALL";
  sprintId?: string | null;
};

export type TimelineItem = {
  id: string;
  key: string;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assigneeIds: string[];
  assignees?: Array<{
    $id: string;
    name: string;
    email?: string;
    profileImageUrl?: string | null;
  }>;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  labels?: string[];
  description?: string | null;
  progress: number; // 0-100
  sprintId?: string | null;
  epicId?: string | null;
  parentId?: string | null;
  children?: TimelineItem[];
  childrenCount?: number;
  isExpanded?: boolean;
  level?: number; // Hierarchy depth
};

export type TimelineSprintGroup = {
  sprint: PopulatedSprint;
  epics: TimelineEpicGroup[];
  isExpanded: boolean;
};

export type TimelineEpicGroup = {
  epic: TimelineItem;
  tasks: TimelineItem[];
  isExpanded: boolean;
};

export type TimelineState = {
  filters: TimelineFilters;
  zoomLevel: TimelineZoomLevel;
  selectedItemId: string | null;
  expandedItems: Set<string>;
  selectedItems: Set<string>; // For multi-select
  scrollPosition: number;
  currentDate: Date;
};

export type TimelineBarPosition = {
  startX: number;
  width: number;
  y: number;
};

export type TimelineDateRange = {
  startDate: Date;
  endDate: Date;
};

export type DragState = {
  isDragging: boolean;
  itemId: string | null;
  type: "move" | "resize-start" | "resize-end" | null;
  startX: number;
  currentX: number;
  originalStartDate?: string;
  originalEndDate?: string;
};

export type TimelineGridConfig = {
  dayWidth: number; // Pixels per day
  rowHeight: number; // Pixels per row
  headerHeight: number; // Height of the date header
  minDate: Date;
  maxDate: Date;
};

export const ZOOM_CONFIGS: Record<TimelineZoomLevel, { dayWidth: number; label: string; unit: "day" | "week" | "month" }> = {
  [TimelineZoomLevel.TODAY]: { dayWidth: 80, label: "Today", unit: "day" },
  [TimelineZoomLevel.WEEKS]: { dayWidth: 40, label: "Weeks", unit: "week" },
  [TimelineZoomLevel.MONTHS]: { dayWidth: 20, label: "Months", unit: "month" },
  [TimelineZoomLevel.QUARTERS]: { dayWidth: 6, label: "Quarters", unit: "month" },
};

export const STATUS_COLORS: Record<WorkItemStatus, { bg: string; text: string; border: string }> = {
  [WorkItemStatus.TODO]: { bg: "bg-gray-100", text: "text-gray-800", border: "border-l-gray-400" },
  [WorkItemStatus.IN_PROGRESS]: { bg: "bg-blue-100", text: "text-blue-800", border: "border-l-blue-500" },
  [WorkItemStatus.IN_REVIEW]: { bg: "bg-purple-100", text: "text-purple-800", border: "border-l-purple-500" },
  [WorkItemStatus.DONE]: { bg: "bg-green-100", text: "text-green-800", border: "border-l-green-500" },
  [WorkItemStatus.BLOCKED]: { bg: "bg-red-100", text: "text-red-800", border: "border-l-red-500" },
};
