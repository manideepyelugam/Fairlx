import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CUSTOM_ROLES_ID || 'custom_roles';
const COLLECTION_NAME = 'Custom Roles';

export async function setupCustomRoles(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'permissions', 65535, true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isDefault', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'color', 64, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
}
