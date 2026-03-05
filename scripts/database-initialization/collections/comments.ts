import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMMENTS_ID || 'comments';
const COLLECTION_NAME = 'Comments';

export async function setupComments(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'taskId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'authorId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'authorName', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'authorImageUrl', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'content', 65535, true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isEdited', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'parentId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'mentions', 4096, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'taskId_idx', IndexType.Key, ['taskId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'authorId_idx', IndexType.Key, ['authorId']);
}
