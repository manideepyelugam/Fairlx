import { Models } from "node-appwrite";

// View type
export enum SavedViewType {
  KANBAN = "KANBAN",
  LIST = "LIST",
  CALENDAR = "CALENDAR",
  TIMELINE = "TIMELINE",
  BACKLOG = "BACKLOG",
  DASHBOARD = "DASHBOARD",
}

// Scope of the saved view
export enum SavedViewScope {
  PERSONAL = "PERSONAL",       // Only visible to creator
  PROJECT = "PROJECT",         // Visible to all project members
  SPACE = "SPACE",             // Visible to all space members
  WORKSPACE = "WORKSPACE",     // Visible to all workspace members
}

// Filter operators
export enum FilterOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  STARTS_WITH = "STARTS_WITH",
  ENDS_WITH = "ENDS_WITH",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN_OR_EQUALS = "GREATER_THAN_OR_EQUALS",
  LESS_THAN_OR_EQUALS = "LESS_THAN_OR_EQUALS",
  IN = "IN",
  NOT_IN = "NOT_IN",
  IS_EMPTY = "IS_EMPTY",
  IS_NOT_EMPTY = "IS_NOT_EMPTY",
  BETWEEN = "BETWEEN",
}

// Individual filter condition
export type FilterCondition = {
  field: string;               // Field name (e.g., "status", "priority", "assigneeIds")
  operator: FilterOperator;
  value: unknown;              // Value to filter by
  isCustomField?: boolean;     // Is this a custom field filter
};

// Filter group with AND/OR logic
export type FilterGroup = {
  logic: "AND" | "OR";
  conditions: (FilterCondition | FilterGroup)[];
};

// Sort configuration
export type SortConfig = {
  field: string;
  direction: "ASC" | "DESC";
};

// Column configuration for list/table views
export type ColumnConfig = {
  field: string;
  visible: boolean;
  width?: number;
  position: number;
};

// Kanban view configuration
export type KanbanViewConfig = {
  groupBy: string;             // Field to group by (usually "status")
  swimlaneBy?: string;         // Optional swimlane grouping
  cardFields: string[];        // Fields to show on cards
  collapsedColumns: string[];  // Column IDs that are collapsed
  columnOrder: string[];       // Custom column ordering
};

// Calendar view configuration
export type CalendarViewConfig = {
  dateField: string;           // Field to use for date (e.g., "dueDate", "startDate")
  endDateField?: string;       // Optional end date field
  defaultView: "month" | "week" | "day";
  colorBy?: string;            // Field to color events by
};

// Timeline view configuration
export type TimelineViewConfig = {
  startDateField: string;
  endDateField: string;
  groupBy?: string;            // Group rows by field
  showDependencies: boolean;
  zoomLevel: "day" | "week" | "month" | "quarter";
};

// Saved view entity
export type SavedView = Models.Document & {
  name: string;
  description?: string | null;
  type: SavedViewType;
  scope: SavedViewScope;
  
  // Ownership
  userId: string;              // Creator
  workspaceId: string;
  spaceId?: string | null;
  projectId?: string | null;
  
  // Filter configuration
  filters?: FilterGroup | null;
  
  // Sort configuration
  sort?: SortConfig[] | null;
  
  // View-specific configuration (JSON)
  kanbanConfig?: KanbanViewConfig | null;
  calendarConfig?: CalendarViewConfig | null;
  timelineConfig?: TimelineViewConfig | null;
  columns?: ColumnConfig[] | null;  // For list view
  
  // Quick filter presets
  quickFilters?: {
    showMine: boolean;          // Only items assigned to me
    showFlagged: boolean;       // Only flagged items
    hideCompleted: boolean;     // Hide completed items
    currentSprintOnly: boolean; // Only items in active sprint
  } | null;
  
  // UI settings
  isDefault: boolean;          // Default view for the context
  isPinned: boolean;           // Pinned to sidebar
  icon?: string | null;        // Custom icon
  color?: string | null;       // Custom color
  position: number;            // Order in view list
};

// Populated saved view
export type PopulatedSavedView = SavedView & {
  creator?: {
    $id: string;
    name: string;
  };
  usageCount?: number;         // How many times this view has been used
  lastUsedAt?: string;         // When this view was last accessed
};

// Default quick filters
export const DEFAULT_QUICK_FILTERS = {
  showMine: false,
  showFlagged: false,
  hideCompleted: false,
  currentSprintOnly: false,
};

// Preset view templates
export const VIEW_PRESETS = {
  myWork: {
    name: "My Work",
    type: SavedViewType.LIST,
    quickFilters: { ...DEFAULT_QUICK_FILTERS, showMine: true },
    sort: [{ field: "priority", direction: "DESC" }, { field: "dueDate", direction: "ASC" }],
  },
  flaggedItems: {
    name: "Flagged",
    type: SavedViewType.LIST,
    quickFilters: { ...DEFAULT_QUICK_FILTERS, showFlagged: true },
  },
  currentSprint: {
    name: "Current Sprint",
    type: SavedViewType.KANBAN,
    quickFilters: { ...DEFAULT_QUICK_FILTERS, currentSprintOnly: true },
  },
  overdueItems: {
    name: "Overdue",
    type: SavedViewType.LIST,
    filters: {
      logic: "AND",
      conditions: [
        { field: "dueDate", operator: FilterOperator.LESS_THAN, value: "today" },
        { field: "status", operator: FilterOperator.NOT_EQUALS, value: "DONE" },
      ],
    },
  },
  upcomingDeadlines: {
    name: "Due This Week",
    type: SavedViewType.LIST,
    filters: {
      logic: "AND",
      conditions: [
        { field: "dueDate", operator: FilterOperator.BETWEEN, value: ["today", "endOfWeek"] },
        { field: "status", operator: FilterOperator.NOT_EQUALS, value: "DONE" },
      ],
    },
  },
};
