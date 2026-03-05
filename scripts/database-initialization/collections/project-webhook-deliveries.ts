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

const COLLECTION_ID = 'project_webhook_deliveries';
const COLLECTION_NAME = 'Project Webhook Deliveries';

export async function setupProjectWebhookDeliveries(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'webhookId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'eventType', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'payload', 65535, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'responseStatus', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'responseBody', 4096, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isSuccess', true);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'attemptCount', false, 1);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'deliveredAt', true);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'webhookId_idx', IndexType.Key, ['webhookId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'isSuccess_idx', IndexType.Key, ['isSuccess']);
}
