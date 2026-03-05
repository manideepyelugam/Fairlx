import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureIntegerAttribute,
    ensureDatetimeAttribute,
    ensureEnumAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_MILESTONES_ID || 'program_milestones';
const COLLECTION_NAME = 'Program Milestones';

export async function setupProgramMilestones(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes (from milestones-route.ts: programId, name, description, targetDate, status, progress, createdBy, position)
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'programId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 512, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 4096, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'targetDate', false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status',
        ['not_started', 'in_progress', 'completed', 'at_risk', 'delayed'], false, 'not_started');
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'progress', false, 0, 0, 100);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'createdBy', 256, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'position', false, 0, 0);

    // Wait for attributes to register
    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'programId_idx', IndexType.Key, ['programId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'programId_position_idx', IndexType.Key, ['programId', 'position']);
}
