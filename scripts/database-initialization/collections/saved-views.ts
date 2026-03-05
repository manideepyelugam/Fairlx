import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureBooleanAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'saved_views';
const COLLECTION_NAME = 'Saved Views';

export async function setupSavedViews(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'createdBy', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'viewType', ['board', 'table', 'calendar', 'timeline', 'dashboard'], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'filters', 65535, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'sortBy', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'groupBy', 256, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isShared', false, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isDefault', false, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'createdBy_idx', IndexType.Key, ['createdBy']);
}
