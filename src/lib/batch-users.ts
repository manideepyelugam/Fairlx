import "server-only";
import { Query, type Users as UsersType, type Models } from "node-appwrite";

/**
 * Batch-fetch Appwrite users by their IDs in a single API call.
 * Eliminates N+1 `users.get()` calls that cause per-request latency spikes.
 *
 * @param users - Appwrite Users instance (admin client)
 * @param userIds - Array of Appwrite user IDs to fetch
 * @returns Map of userId -> User object
 */
export async function batchGetUsers(
    users: UsersType,
    userIds: string[]
): Promise<Map<string, Models.User<Models.Preferences>>> {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return new Map();

    // Appwrite users.list supports Query.equal("$id", [...]) for batch lookup
    // Process in chunks of 100 (Appwrite's max for Query.equal array values)
    const CHUNK_SIZE = 100;
    const userMap = new Map<string, Models.User<Models.Preferences>>();

    for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
        const chunk = unique.slice(i, i + CHUNK_SIZE);
        try {
            const result = await users.list([
                Query.equal("$id", chunk),
                Query.limit(chunk.length),
            ]);
            for (const user of result.users) {
                userMap.set(user.$id, user);
            }
        } catch {
            // If batch fails, fall back to individual calls for this chunk
            await Promise.all(
                chunk.map(async (id) => {
                    try {
                        const user = await users.get(id);
                        userMap.set(user.$id, user);
                    } catch {
                        // User not found - skip
                    }
                })
            );
        }
    }

    return userMap;
}
