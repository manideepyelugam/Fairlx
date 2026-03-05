import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROCESSED_EVENTS_ID || 'processed_events';
const COLLECTION_NAME = 'Processed Events';

export async function setupProcessedEvents(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'eventId', 512, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'source', 256, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'processedAt', true);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'eventId_idx', IndexType.Unique, ['eventId']);
}
