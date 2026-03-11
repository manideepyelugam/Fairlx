import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIntegerAttribute,
    ensureFloatAttribute,
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
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status', ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'planning', 'active', 'completed'], false, 'PLANNED');
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'startDate', false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'endDate', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'goal', 2048, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'position', false, 0);

    // Metrics (computed on completion)
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'completedPoints', false, 0);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'totalPoints', false, 0);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'velocity', false, 0);

    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'completedAt', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'status_idx', IndexType.Key, ['status']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'position_idx', IndexType.Key, ['position']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_status_idx', IndexType.Key, ['projectId', 'status']);
}
