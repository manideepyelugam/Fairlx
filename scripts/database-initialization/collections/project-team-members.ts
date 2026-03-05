import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_TEAM_MEMBERS_ID || 'project_team_members';
const COLLECTION_NAME = 'Project Team Members';

export async function setupProjectTeamMembers(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'teamId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'role', ['lead', 'member'], false, 'member');
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'addedAt', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'teamId_idx', IndexType.Key, ['teamId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'teamId_userId_idx', IndexType.Key, ['teamId', 'userId']);
}
