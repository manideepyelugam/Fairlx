import "server-only";

import { Client, Databases, Query } from "node-appwrite";

import { cached } from "@/lib/redis/cache";
import { CK, TTL } from "@/lib/redis/keys";
import { decryptEnv } from "@/lib/byob-crypto";
import { DATABASE_ID, BYOB_TENANTS_ID } from "@/config";

/**
 * AppwriteConfig — resolved Appwrite connection parameters.
 * Used by both Cloud and BYOB flows.
 */
export interface AppwriteConfig {
    endpoint: string;
    project: string;
    key: string;
    databaseId: string;
}

/**
 * Returns the static Cloud Appwrite config (current default behaviour).
 */
export function getCloudConfig(): AppwriteConfig {
    return {
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
        project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,
        key: process.env.NEXT_APPWRITE_KEY!,
        databaseId: DATABASE_ID,
    };
}

/**
 * Resolve the Appwrite config for a BYOB tenant by orgSlug.
 *
 * 1. Check Redis cache (5 min TTL)
 * 2. If MISS → look up byob_tenants by orgSlug
 * 3. Decrypt the encrypted env blob
 * 4. Return AppwriteConfig
 *
 * Throws if tenant not found or not ACTIVE.
 */
export async function resolveAppwriteConfig(
    orgSlug: string
): Promise<AppwriteConfig> {
    return cached<AppwriteConfig>(
        CK.byobConfig(orgSlug),
        async () => {
            // Use our own (Cloud) Appwrite to look up the tenant record
            const client = new Client()
                .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
                .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
                .setKey(process.env.NEXT_APPWRITE_KEY!);

            const databases = new Databases(client);

            const result = await databases.listDocuments(
                DATABASE_ID,
                BYOB_TENANTS_ID,
                [Query.equal("orgSlug", orgSlug), Query.limit(1)]
            );

            if (result.total === 0) {
                throw new Error(`BYOB tenant not found: ${orgSlug}`);
            }

            const tenant = result.documents[0];

            if (tenant.status !== "ACTIVE") {
                throw new Error(
                    `BYOB tenant "${orgSlug}" is not active (status: ${tenant.status})`
                );
            }

            if (!tenant.encryptedEnv || !tenant.envIv || !tenant.envTag) {
                throw new Error(
                    `BYOB tenant "${orgSlug}" has no encrypted env configuration`
                );
            }

            // Decrypt the env blob
            const envJson = decryptEnv(
                tenant.encryptedEnv,
                tenant.envIv,
                tenant.envTag
            );
            const env = JSON.parse(envJson) as Record<string, string>;

            return {
                endpoint: env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
                project: env.NEXT_PUBLIC_APPWRITE_PROJECT,
                key: env.NEXT_APPWRITE_KEY,
                databaseId: env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "fairlx",
            };
        },
        TTL.BYOB_CONFIG
    );
}
