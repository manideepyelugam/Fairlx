import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureBooleanAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ORGANIZATION_MEMBERS_ID || 'organization_members';
const COLLECTION_NAME = 'Organization Members';

export async function setupOrganizationMembers(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'organizationId', 36, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 36, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'role', ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 128, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'email', 320, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'profileImageUrl', 1024, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status', ['ACTIVE', 'INVITED', 'SUSPENDED'], false, 'ACTIVE');
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'mustResetPassword', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'imageUrl', 1024, false);
    // departmentIds NOT stored here — tracked via org_member_departments junction table
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'invitedAt', false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'joinedAt', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'organizationId_idx', IndexType.Key, ['organizationId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'organizationId_userId_idx', IndexType.Unique, ['organizationId', 'userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'orgRole_idx', IndexType.Key, ['organizationId', 'role']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'email_idx', IndexType.Key, ['email']);
}
