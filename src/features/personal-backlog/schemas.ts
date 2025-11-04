import { z } from "zod";
import { BacklogItemType, BacklogItemPriority, BacklogItemStatus } from "./types";

export const createBacklogItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(10000).optional().nullable(),
  workspaceId: z.string(),
  priority: z.nativeEnum(BacklogItemPriority),
  status: z.nativeEnum(BacklogItemStatus),
  type: z.nativeEnum(BacklogItemType),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  flagged: z.boolean().optional(),
});

export const updateBacklogItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional().nullable(),
  priority: z.nativeEnum(BacklogItemPriority).optional(),
  status: z.nativeEnum(BacklogItemStatus).optional(),
  type: z.nativeEnum(BacklogItemType).optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  flagged: z.boolean().optional(),
  position: z.number().optional(),
});

export const bulkUpdateBacklogItemsSchema = z.object({
  items: z.array(
    z.object({
      $id: z.string(),
      status: z.nativeEnum(BacklogItemStatus).optional(),
      position: z.number().optional(),
    })
  ),
});
