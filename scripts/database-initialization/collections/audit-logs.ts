import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'audit_logs';
const COLLECTION_NAME = 'Audit Logs';

export async function setupAuditLogs(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'userName', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'action', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'resourceType', 128, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'resourceId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'resourceName', 512, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'metadata', 65535, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'ipAddress', 64, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'userId_idx', IndexType.Key, ['userId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'action_idx', IndexType.Key, ['action']);
}
