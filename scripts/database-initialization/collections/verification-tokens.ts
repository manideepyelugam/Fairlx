import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureBooleanAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'verification_tokens';
const COLLECTION_NAME = 'Verification Tokens';

export async function setupVerificationTokens(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'token', 512, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'type', ['email', 'password_reset', '2fa'], true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'expiresAt', true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isUsed', false, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'token_idx', IndexType.Unique, ['token']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
}
