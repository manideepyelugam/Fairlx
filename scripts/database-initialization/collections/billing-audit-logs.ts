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

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BILLING_AUDIT_LOGS_ID || 'billing_audit_logs';
const COLLECTION_NAME = 'Billing Audit Logs';

export async function setupBillingAuditLogs(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'eventType', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 2048, false);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'amount', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'metadata', 65535, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'createdAt', true);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'billingAccountId_idx', IndexType.Key, ['billingAccountId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'eventType_idx', IndexType.Key, ['eventType']);
}
