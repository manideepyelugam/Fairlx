import { z } from "zod";

import { TaskStatus } from "./types";

export const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  status: z.union([z.nativeEnum(TaskStatus), z.string()]).refine(
    (value) => Object.values(TaskStatus).includes(value as TaskStatus) || typeof value === "string",
    { message: "Invalid status" }
  ),
  workspaceId: z.string().trim().min(1, "Required"),
  projectId: z.string().trim().min(1, "Required"),
  dueDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  assigneeId: z.string().trim().min(1, "Required"),
  description: z.string().optional(),
});
