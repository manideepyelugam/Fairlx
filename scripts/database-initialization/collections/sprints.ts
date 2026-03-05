import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SPRINTS_ID || 'sprints';
const COLLECTION_NAME = 'Sprints';

export async function setupSprints(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status', ['planning', 'active', 'completed'], false, 'planning');
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'startDate', false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'endDate', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'goal', 2048, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'completedAt', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'status_idx', IndexType.Key, ['status']);
}
