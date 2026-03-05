import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIntegerAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID || 'projects';
const COLLECTION_NAME = 'Projects';

export async function setupProjects(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'imageUrl', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'methodology', ['scrum', 'kanban', 'hybrid'], false, 'scrum');
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'wipLimit', false, undefined, 0, 1000);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'spaceId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'teamId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'programId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'prefix', 32, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'spaceId_idx', IndexType.Key, ['spaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'programId_idx', IndexType.Key, ['programId']);
}
