import { createAdminClient } from "@/lib/appwrite";
import { unstable_cache } from "next/cache";
import { TIMELINE_CONFIG } from "../config";

interface Assignee {
  $id: string;
  name: string;
  email?: string;
  profileImageUrl?: string | null;
}

/**
 * Fetch assignee details by ID
 * Cached to prevent repeated API calls
 */
export async function getAssignee(assigneeId: string): Promise<Assignee | null> {
  try {
    const { users } = await createAdminClient();
    const user = await users.get(assigneeId);
    
    return {
      $id: user.$id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.prefs?.profileImageUrl || null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch multiple assignees in batch
 * More efficient than individual fetches
 */
export async function getAssignees(assigneeIds: string[]): Promise<Assignee[]> {
  if (assigneeIds.length === 0) return [];

  const results = await Promise.all(
    assigneeIds.map(id => getCachedAssignee(id))
  );

  return results.filter((a): a is Assignee => a !== null);
}

/**
 * Cached version of assignee fetch
 * Revalidates every 5 minutes
 */
export async function getCachedAssignee(assigneeId: string) {
  return unstable_cache(
    async () => getAssignee(assigneeId),
    [`assignee-${assigneeId}`],
    {
      revalidate: TIMELINE_CONFIG.cache.assigneeTTL,
      tags: [`assignee-${assigneeId}`],
    }
  )();
}
