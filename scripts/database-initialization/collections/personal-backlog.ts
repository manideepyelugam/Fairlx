import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIntegerAttribute,
    ensureBooleanAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PERSONAL_BACKLOG_ID || 'personalBacklog';
const COLLECTION_NAME = 'Personal Backlog';

export async function setupPersonalBacklog(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'title', 512, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 65535, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'priority', ['none', 'low', 'medium', 'high', 'urgent'], false, 'none');
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'type', ['task', 'story', 'bug', 'idea', 'note'], false, 'task');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'labels', 4096, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'dueDate', false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isPromoted', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'promotedToId', 256, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'position', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
}
