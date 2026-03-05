import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ORG_MEMBER_DEPARTMENTS_ID || 'org_member_departments';
const COLLECTION_NAME = 'Org Member Departments';

export async function setupOrgMemberDepartments(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'organizationId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'memberId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'departmentId', 256, true);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'organizationId_idx', IndexType.Key, ['organizationId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'memberId_idx', IndexType.Key, ['memberId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'departmentId_idx', IndexType.Key, ['departmentId']);
}
