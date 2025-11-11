"use server";

import { revalidateTag } from "next/cache";

/**
 * Revalidate timeline cache after data mutations
 * Call this after creating, updating, or deleting work items/sprints
 */
export async function revalidateTimeline(workspaceId: string) {
  revalidateTag("timeline");
  revalidateTag(`workspace-${workspaceId}`);
}

/**
 * Revalidate specific assignee cache
 */
export async function revalidateAssignee(assigneeId: string) {
  revalidateTag(`assignee-${assigneeId}`);
}

/**
 * Revalidate all caches (use sparingly)
 */
export async function revalidateAll() {
  revalidateTag("timeline");
}
