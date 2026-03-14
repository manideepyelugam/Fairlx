import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_PERMISSIONS_ID || 'project_permissions';
const COLLECTION_NAME = 'Project Permissions';

export async function setupProjectPermissions(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'permissionKey', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'assignedToTeamId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'assignedToUserId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'grantedBy', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'grantedAt', 256, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'assignedToUserId_idx', IndexType.Key, ['assignedToUserId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'assignedToTeamId_idx', IndexType.Key, ['assignedToTeamId']);
}
