import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureIntegerAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DEPARTMENTS_ID || 'departments';
const COLLECTION_NAME = 'Departments';

export async function setupDepartments(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'organizationId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 2048, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'color', 64, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'icon', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'parentDepartmentId', 256, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'memberCount', false, 0);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'organizationId_idx', IndexType.Key, ['organizationId']);
}
