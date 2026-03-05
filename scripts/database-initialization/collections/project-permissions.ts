import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
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
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'subjectType', ['user', 'team', 'role'], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'subjectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'permissions', 65535, true);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'subjectId_idx', IndexType.Key, ['subjectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_subjectId_idx', IndexType.Key, ['projectId', 'subjectId']);
}
