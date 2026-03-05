import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIntegerAttribute,
    ensureFloatAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WORK_ITEMS_ID || 'workItems';
const COLLECTION_NAME = 'Work Items';

export async function setupWorkItems(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 512, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'spaceId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'spaceKey', 32, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'itemNumber', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'status', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'customStatusId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'assigneeIds', 4096, false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'dueDate', false);
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'startDate', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 65535, false);
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'priority', ['none', 'low', 'medium', 'high', 'urgent'], false, 'none');
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'type', ['task', 'story', 'bug', 'epic', 'subtask'], false, 'task');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'customType', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'labels', 4096, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'epicId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'sprintId', 256, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'storyPoints', false, undefined, 0);
    await ensureFloatAttribute(databases, databaseId, COLLECTION_ID, 'estimatedHours', false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'position', false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'parentId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'programId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'customFields', 65535, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'teamIds', 4096, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'sprintId_idx', IndexType.Key, ['sprintId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'epicId_idx', IndexType.Key, ['epicId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'spaceId_idx', IndexType.Key, ['spaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'status_idx', IndexType.Key, ['status']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'dueDate_idx', IndexType.Key, ['dueDate']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_status_idx', IndexType.Key, ['projectId', 'status']);
}
