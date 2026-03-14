import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIntegerAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'project_webhooks';
const COLLECTION_NAME = 'Project Webhooks';

export async function setupProjectWebhooks(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'url', 1024, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'secret', 512, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'events', 4096, true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'enabled', false, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'createdByUserId', 256, true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'lastTriggeredAt', false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'failureCount', false, 0);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
}
