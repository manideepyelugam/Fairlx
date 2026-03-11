import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIntegerAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'spaces';
const COLLECTION_NAME = 'Spaces';

export async function setupSpaces(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 2048, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'key', 16, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'color', 64, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'icon', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'visibility', 64, false, 'PUBLIC');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'template', 64, false, 'SOFTWARE');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'imageUrl', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'ownerId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'defaultWorkflowId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workflowInheritance', 64, false, 'NONE');
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'position', false, 0);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'archived', false, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'memberCount', false, 0);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'archived_idx', IndexType.Key, ['archived']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_key_idx', IndexType.Unique, ['workspaceId', 'key']);
}
