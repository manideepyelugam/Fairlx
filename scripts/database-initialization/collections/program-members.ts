import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureDatetimeAttribute,
    ensureEnumAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_MEMBERS_ID || 'program_members';
const COLLECTION_NAME = 'Program Members';

export async function setupProgramMembers(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes (from members-route.ts: programId, workspaceId, userId, role, addedBy, addedAt)
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'programId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'role', ['lead', 'admin', 'member', 'viewer'], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'addedBy', 256, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'addedAt', false);

    // Wait for attributes to register
    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'programId_idx', IndexType.Key, ['programId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'programId_userId_idx', IndexType.Unique, ['programId', 'userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
}
