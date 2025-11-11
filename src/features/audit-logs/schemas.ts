import { z } from "zod";
import { ActivityType } from "./types";

export const getActivityLogsSchema = z.object({
  workspaceId: z.string(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  type: z.nativeEnum(ActivityType).optional(),
  action: z.enum(["created", "updated", "deleted"]).optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  limit: z.coerce.number().min(1).max(100).default(50), // Page size for infinite loading
  cursor: z.string().optional(), // Cursor for pagination (timestamp + id)
});

export const getActivityStatsSchema = z.object({
  workspaceId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
