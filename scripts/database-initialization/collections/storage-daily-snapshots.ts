import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureFloatAttribute,
    ensureIntegerAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_SNAPSHOTS_ID || 'storage_daily_snapshots';
const COLLECTION_NAME = 'Storage Daily Snapshots';

export async function setupStorageDailySnapshots(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'date', 16, true);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'storageBytes', true);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'fileCount', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'date_idx', IndexType.Key, ['date']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_date_idx', IndexType.Key, ['workspaceId', 'date']);
}
