import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureFloatAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WALLETS_ID || 'wallets';
const COLLECTION_NAME = 'Wallets';

export async function setupWallets(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, true);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'balance', false, 0);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'currency', 8, false, 'INR');
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'lifetimeTopUp', false, 0);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'lifetimeDeducted', false, 0);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'lastTopUpAt', false);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'dailyTopUpTotal', false, 0);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'dailyTopUpDate', 16, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'billingAccountId_idx', IndexType.Unique, ['billingAccountId']);
}
