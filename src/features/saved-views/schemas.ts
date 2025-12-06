import { z } from "zod";
import { SavedViewType, SavedViewScope, FilterOperator } from "./types";

// Filter condition schema
const filterConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.nativeEnum(FilterOperator),
  value: z.unknown(),
  isCustomField: z.boolean().optional(),
});

// Recursive filter group schema
const filterGroupSchema: z.ZodType<{
  logic: "AND" | "OR";
  conditions: unknown[];
}> = z.object({
  logic: z.enum(["AND", "OR"]),
  conditions: z.array(z.lazy(() => z.union([filterConditionSchema, filterGroupSchema]))),
});

// Sort config schema
const sortConfigSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(["ASC", "DESC"]),
});

// Column config schema
const columnConfigSchema = z.object({
  field: z.string().min(1),
  visible: z.boolean(),
  width: z.number().min(50).max(1000).optional(),
  position: z.number().min(0),
});

// Kanban view config schema
const kanbanViewConfigSchema = z.object({
  groupBy: z.string().default("status"),
  swimlaneBy: z.string().optional(),
  cardFields: z.array(z.string()).default(["title", "assignees", "priority"]),
  collapsedColumns: z.array(z.string()).default([]),
  columnOrder: z.array(z.string()).default([]),
});

// Calendar view config schema
const calendarViewConfigSchema = z.object({
  dateField: z.string().default("dueDate"),
  endDateField: z.string().optional(),
  defaultView: z.enum(["month", "week", "day"]).default("month"),
  colorBy: z.string().optional(),
});

// Timeline view config schema
const timelineViewConfigSchema = z.object({
  startDateField: z.string().default("startDate"),
  endDateField: z.string().default("dueDate"),
  groupBy: z.string().optional(),
  showDependencies: z.boolean().default(true),
  zoomLevel: z.enum(["day", "week", "month", "quarter"]).default("week"),
});

// Quick filters schema
const quickFiltersSchema = z.object({
  showMine: z.boolean().default(false),
  showFlagged: z.boolean().default(false),
  hideCompleted: z.boolean().default(false),
  currentSprintOnly: z.boolean().default(false),
});

// Create saved view
export const createSavedViewSchema = z.object({
  name: z.string().trim().min(1, "View name is required").max(100),
  description: z.string().trim().max(500).optional(),
  type: z.nativeEnum(SavedViewType),
  scope: z.nativeEnum(SavedViewScope).default(SavedViewScope.PERSONAL),
  
  workspaceId: z.string().min(1),
  spaceId: z.string().optional(),
  projectId: z.string().optional(),
  
  filters: filterGroupSchema.optional(),
  sort: z.array(sortConfigSchema).optional(),
  
  kanbanConfig: kanbanViewConfigSchema.optional(),
  calendarConfig: calendarViewConfigSchema.optional(),
  timelineConfig: timelineViewConfigSchema.optional(),
  columns: z.array(columnConfigSchema).optional(),
  
  quickFilters: quickFiltersSchema.optional(),
  
  isDefault: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Update saved view
export const updateSavedViewSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  scope: z.nativeEnum(SavedViewScope).optional(),
  
  filters: filterGroupSchema.optional().nullable(),
  sort: z.array(sortConfigSchema).optional().nullable(),
  
  kanbanConfig: kanbanViewConfigSchema.optional().nullable(),
  calendarConfig: calendarViewConfigSchema.optional().nullable(),
  timelineConfig: timelineViewConfigSchema.optional().nullable(),
  columns: z.array(columnConfigSchema).optional().nullable(),
  
  quickFilters: quickFiltersSchema.optional().nullable(),
  
  isDefault: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  icon: z.string().max(10).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  position: z.number().min(0).optional(),
});

// Clone saved view
export const cloneSavedViewSchema = z.object({
  viewId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  scope: z.nativeEnum(SavedViewScope).optional(),
});

// Apply view (record usage)
export const applyViewSchema = z.object({
  viewId: z.string().min(1),
});
