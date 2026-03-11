import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BYOB_TENANTS_ID || 'byob_tenants';
const COLLECTION_NAME = 'BYOB Tenants';

export async function setupBYOBTenants(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        // Intentionally empty: only Fairlx server (admin key) can read/write
    ]);

    // Core identity
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'orgSlug', 128, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'orgName', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'ownerUserId', 256, true);

    // Status
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status',
        ['PENDING_SETUP', 'SETUP_IN_PROGRESS', 'ACTIVE', 'SUSPENDED'], false, 'PENDING_SETUP');

    // Encrypted env blob (AES-256-GCM)
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'encryptedEnv', 65536, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'envIv', 128, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'envTag', 128, false);

    // Setup metadata
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'setupCompletedAt', 64, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'dbInitStatus',
        ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], false, 'NOT_STARTED');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'dbInitLog', 65536, false);

    // Timestamps
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'createdAt', 64, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'updatedAt', 64, true);

    // Wait for attributes to register
    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'orgSlug_idx', IndexType.Unique, ['orgSlug']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'ownerUserId_idx', IndexType.Key, ['ownerUserId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'status_idx', IndexType.Key, ['status']);
}
