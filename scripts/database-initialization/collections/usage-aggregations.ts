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

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USAGE_AGGREGATIONS_ID || 'usage_aggregations';
const COLLECTION_NAME = 'Usage Aggregations';

export async function setupUsageAggregations(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'period', 64, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'periodType', ['daily', 'monthly'], true);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'trafficBytes', false, 0);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'storageBytes', false, 0);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'computeUnits', false, 0);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'totalCost', false, 0);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'currency', 8, false, 'INR');

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'billingAccountId_idx', IndexType.Key, ['billingAccountId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'period_idx', IndexType.Key, ['period']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_period_idx', IndexType.Key, ['workspaceId', 'period']);
}
