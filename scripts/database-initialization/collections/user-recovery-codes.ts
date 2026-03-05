import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'user_recovery_codes';
const COLLECTION_NAME = 'User Recovery Codes';

export async function setupUserRecoveryCodes(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'codeHash', 512, true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isUsed', false, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'usedAt', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
}
