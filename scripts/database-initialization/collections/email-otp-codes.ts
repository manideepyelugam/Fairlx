import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIntegerAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'email_otp_codes';
const COLLECTION_NAME = 'Email OTP Codes';

export async function setupEmailOtpCodes(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'email', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'otpHash', 512, true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'expiresAt', true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isUsed', false, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'attempts', false, 0);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'email_idx', IndexType.Key, ['email']);
}
