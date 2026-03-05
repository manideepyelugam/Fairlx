import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureBooleanAttribute,
    ensureIntegerAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = 'custom_fields';
const COLLECTION_NAME = 'Custom Fields';

export async function setupCustomFields(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'fieldType', ['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email'], true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'options', 4096, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isRequired', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'defaultValue', 1024, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'position', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 1024, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
}
