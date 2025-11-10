import { z } from "zod";
import { WorkItemType, WorkItemStatus, WorkItemPriority } from "../sprints/types";

export const timelineFiltersSchema = z.object({
  search: z.string().default(""),
  epicId: z.string().optional().nullable(),
  type: z.nativeEnum(WorkItemType).or(z.literal("ALL")).optional(),
  label: z.string().optional().nullable(),
  status: z.nativeEnum(WorkItemStatus).or(z.literal("ALL")).optional(),
  sprintId: z.string().optional().nullable(),
});

export const updateTimelineItemSchema = z.object({
  itemId: z.string(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.nativeEnum(WorkItemStatus).optional(),
  assigneeIds: z.array(z.string()).optional(),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(WorkItemPriority).optional(),
  labels: z.array(z.string()).optional(),
  estimatedHours: z.number().optional(),
});

export const bulkUpdateTimelineItemsSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      status: z.nativeEnum(WorkItemStatus).optional(),
    })
  ),
});

export type TimelineFiltersInput = z.infer<typeof timelineFiltersSchema>;
export type UpdateTimelineItemInput = z.infer<typeof updateTimelineItemSchema>;
export type BulkUpdateTimelineItemsInput = z.infer<typeof bulkUpdateTimelineItemsSchema>;
