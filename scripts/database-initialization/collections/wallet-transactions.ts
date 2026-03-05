import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureFloatAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WALLET_TRANSACTIONS_ID || 'wallet_transactions';
const COLLECTION_NAME = 'Wallet Transactions';

export async function setupWalletTransactions(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'walletId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'type', ['credit', 'debit'], true);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'amount', true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'currency', 8, false, 'INR');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'razorpayPaymentId', 256, false);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'balanceAfter', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'metadata', 4096, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'walletId_idx', IndexType.Key, ['walletId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'billingAccountId_idx', IndexType.Key, ['billingAccountId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'type_idx', IndexType.Key, ['type']);
}
