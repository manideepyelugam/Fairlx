import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureFloatAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USAGE_EVENTS_ID || 'usage_events';
const COLLECTION_NAME = 'Usage Events';

export async function setupUsageEvents(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'organizationId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'eventType', ['traffic', 'storage', 'compute'], true);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'quantity', true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'unit', 64, true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'timestamp', true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'metadata', 4096, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'source', 256, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'billingAccountId_idx', IndexType.Key, ['billingAccountId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'eventType_idx', IndexType.Key, ['eventType']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'timestamp_idx', IndexType.Key, ['timestamp']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_timestamp_idx', IndexType.Key, ['workspaceId', 'timestamp']);
}
