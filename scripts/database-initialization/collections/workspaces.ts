import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureEnumAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID || 'workspaces';
const COLLECTION_NAME = 'Workspaces';

export async function setupWorkspaces(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'imageUrl', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'inviteCode', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'accountType', ['personal', 'organization'], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'organizationId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'billingAccountId', 256, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'uiMode', ['simple', 'advanced'], false, 'simple');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'features', 4096, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isDefault', false, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'billingScope', ['user', 'organization'], false, 'user');

    // Wait for attributes to register
    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'inviteCode_idx', IndexType.Unique, ['inviteCode']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'organizationId_idx', IndexType.Key, ['organizationId']);
}
