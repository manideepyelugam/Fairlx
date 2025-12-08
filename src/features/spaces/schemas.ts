import { z } from "zod";
import { SpaceVisibility, SpaceTemplate, SpaceRole } from "./types";

export const createSpaceSchema = z.object({
  name: z.string().trim().min(1, "Space name is required").max(100),
  key: z.string().trim().min(2, "Key must be at least 2 characters").max(10).toUpperCase()
    .regex(/^[A-Z][A-Z0-9]*$/, "Key must start with a letter and contain only letters and numbers"),
  description: z.string().trim().max(500).optional(),
  workspaceId: z.string().min(1),
  visibility: z.nativeEnum(SpaceVisibility).default(SpaceVisibility.PUBLIC),
  template: z.nativeEnum(SpaceTemplate).default(SpaceTemplate.SOFTWARE),
  color: z.string().optional(),
  image: z.union([
    z.instanceof(File),
    z.string().transform((value) => (value === "" ? undefined : value)),
  ]).optional(),
});

export const updateSpaceSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  key: z.string().trim().min(2).max(10).toUpperCase()
    .regex(/^[A-Z][A-Z0-9]*$/, "Key must start with a letter and contain only letters and numbers")
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
  visibility: z.nativeEnum(SpaceVisibility).optional(),
  color: z.string().optional().nullable(),
  image: z.union([
    z.instanceof(File),
    z.string().transform((value) => (value === "" ? undefined : value)),
  ]).optional(),
  defaultWorkflowId: z.string().optional().nullable(),
  archived: z.boolean().optional(),
});

export const addSpaceMemberSchema = z.object({
  spaceId: z.string().min(1),
  memberId: z.string().min(1),
  role: z.nativeEnum(SpaceRole).default(SpaceRole.MEMBER),
});

export const updateSpaceMemberRoleSchema = z.object({
  spaceId: z.string().min(1),
  memberId: z.string().min(1),
  role: z.nativeEnum(SpaceRole),
});

export const removeSpaceMemberSchema = z.object({
  spaceId: z.string().min(1),
  memberId: z.string().min(1),
});
