import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'workflow_transitions';
const COLLECTION_NAME = 'Workflow Transitions';

export async function setupWorkflowTransitions(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workflowId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'fromStatusId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'toStatusId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'conditions', 4096, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'allowedRoles', 4096, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'requiresComment', false, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workflowId_idx', IndexType.Key, ['workflowId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'fromStatusId_idx', IndexType.Key, ['fromStatusId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'fromStatusId_toStatusId_idx', IndexType.Key, ['fromStatusId', 'toStatusId']);
}
