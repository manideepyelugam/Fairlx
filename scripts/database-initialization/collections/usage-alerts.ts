import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureFloatAttribute,
    ensureBooleanAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USAGE_ALERTS_ID || 'usage_alerts';
const COLLECTION_NAME = 'Usage Alerts';

export async function setupUsageAlerts(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'alertType', ['cost', 'traffic', 'storage', 'compute'], true);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'threshold', true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isActive', false, true);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'lastTriggeredAt', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'notifyEmail', 256, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'billingAccountId_idx', IndexType.Key, ['billingAccountId']);
}
