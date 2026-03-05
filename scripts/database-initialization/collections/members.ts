import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID || 'members';
const COLLECTION_NAME = 'Members';

export async function setupMembers(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'role', ['admin', 'member'], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'email', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'imageUrl', 1024, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_userId_idx', IndexType.Key, ['workspaceId', 'userId']);
}
