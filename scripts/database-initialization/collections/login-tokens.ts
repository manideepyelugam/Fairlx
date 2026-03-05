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

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_LOGIN_TOKENS_ID || 'login_tokens';
const COLLECTION_NAME = 'Login Tokens';

export async function setupLoginTokens(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'token', 512, true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'expiresAt', true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isUsed', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'ipAddress', 64, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userAgent', 512, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'token_idx', IndexType.Unique, ['token']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
}
