import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'space_members';
const COLLECTION_NAME = 'Space Members';

export async function setupSpaceMembers(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'spaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'memberId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);

    // Force recreate role with uppercase if it's currently lowercase
    try {
        const attr = await databases.getAttribute(databaseId, COLLECTION_ID, 'role');
        if ((attr as any).format === 'enum' && (attr as any).elements.includes('admin')) {
            logger.info('Deleting lowercase role attribute for recreation...');
            await databases.deleteAttribute(databaseId, COLLECTION_ID, 'role');
            await sleep(2000);
        }
    } catch { }

    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'role', ['ADMIN', 'MEMBER', 'VIEWER'], false, 'MEMBER');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'joinedAt', 128, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'spaceId_idx', IndexType.Key, ['spaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'memberId_idx', IndexType.Key, ['memberId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'spaceId_userId_idx', IndexType.Key, ['spaceId', 'userId']);
}
