import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_ID || 'notifications';
const COLLECTION_NAME = 'Notifications';

export async function setupNotifications(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'type', 128, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'title', 512, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'message', 2048, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'resourceId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'resourceType', 128, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isRead', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'actorId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'actorName', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'metadata', 4096, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_isRead_idx', IndexType.Key, ['userId', 'isRead']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
}
