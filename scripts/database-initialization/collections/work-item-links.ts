import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'work_item_links';
const COLLECTION_NAME = 'Work Item Links';

export async function setupWorkItemLinks(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'sourceItemId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'targetItemId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'linkType', [
        'blocks', 'is_blocked_by', 'relates_to', 'duplicates',
        'is_duplicated_by', 'depends_on', 'is_depended_on_by',
    ], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'createdBy', 256, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'sourceItemId_idx', IndexType.Key, ['sourceItemId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'targetItemId_idx', IndexType.Key, ['targetItemId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'sourceItemId_targetItemId_idx', IndexType.Key, ['sourceItemId', 'targetItemId']);
}
