import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureFloatAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BILLING_ACCOUNTS_ID || 'billing_accounts';
const COLLECTION_NAME = 'Billing Accounts';

export async function setupBillingAccounts(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'ownerId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'ownerType', ['personal', 'organization'], true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status', ['active', 'grace_period', 'suspended', 'cancelled'], false, 'active');
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'balance', false, 0);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'currency', 8, false, 'INR');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'razorpayCustomerId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'razorpayMandateId', 256, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'mandateStatus', ['pending', 'confirmed', 'rejected', 'cancelled'], false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'gracePeriodEndsAt', false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'suspendedAt', false);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'totalUsageCost', false, 0);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'lastBilledAt', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'settings', 4096, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'ownerId_idx', IndexType.Key, ['ownerId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'status_idx', IndexType.Key, ['status']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'razorpayCustomerId_idx', IndexType.Key, ['razorpayCustomerId']);
}
