import { z } from "zod";

import { TaskStatus } from "./types";

const baseTaskSchema = z.object({
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
  estimatedHours: z.number().min(0).optional(),
});

export const createTaskSchema = baseTaskSchema.refine(
  (data) => {
    if (data.endDate && data.dueDate) {
      return data.endDate >= data.dueDate;
    }
    return true;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

export const updateTaskSchema = baseTaskSchema.omit({ workspaceId: true }).partial().refine(
  (data) => {
    if (data.endDate && data.dueDate) {
      return data.endDate >= data.dueDate;
    }
    return true;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);
