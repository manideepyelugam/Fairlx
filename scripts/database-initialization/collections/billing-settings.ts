import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureFloatAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BILLING_SETTINGS_ID || 'billing_settings';
const COLLECTION_NAME = 'Billing Settings';

export async function setupBillingSettings(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'autoTopUp', false, false);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'topUpAmount', false);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'topUpThreshold', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'invoiceEmail', 256, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'notifyOnInvoice', false, true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'notifyOnLowBalance', false, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'customRates', 4096, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'billingAccountId_idx', IndexType.Unique, ['billingAccountId']);
}
