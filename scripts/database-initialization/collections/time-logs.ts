import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureFloatAttribute,
    ensureBooleanAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TIME_LOGS_ID || 'time_logs';
const COLLECTION_NAME = 'Time Logs';

export async function setupTimeLogs(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'taskId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'loggedHours', true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'logDate', true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 2048, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isBillable', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'createdBy', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'lastModifiedBy', 256, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'taskId_idx', IndexType.Key, ['taskId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'logDate_idx', IndexType.Key, ['logDate']);
}
