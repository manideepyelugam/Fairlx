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

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROGRAMS_ID || 'programs';
const COLLECTION_NAME = 'Programs';

export async function setupPrograms(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 4096, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'color', 64, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'icon', 256, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status', ['active', 'completed', 'archived', 'on_hold'], false, 'active');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'ownerId', 256, true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'startDate', false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'endDate', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'objectives', 4096, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'createdBy', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'lastModifiedBy', 256, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'status_idx', IndexType.Key, ['status']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'ownerId_idx', IndexType.Key, ['ownerId']);
}
