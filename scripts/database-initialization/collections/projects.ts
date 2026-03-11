import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureEnumAttribute,
    ensureIntegerAttribute,
    ensureBooleanAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID || 'projects';
const COLLECTION_NAME = 'Projects';

export async function setupProjects(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 2048, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'imageUrl', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'spaceId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'programId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'deadline', 128, false); // For timeline/calendar

    // Board & Workflow
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'boardType', ['SCRUM', 'KANBAN', 'HYBRID'], false, 'SCRUM');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'key', 16, false); // Unique prefix like "PROJ"
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'status', ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'], false, 'ACTIVE');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workflowId', 256, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'workflowLocked', false, false);

    // Settings & Assignment
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'defaultAssigneeId', 256, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'autoAssignToCreator', false, false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'enableTimeTracking', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'wipLimits', 4096, false); // JSON
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'defaultSwimlane', 32, false, 'none');

    // Agile Settings
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'defaultSprintDuration', false, 14);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'sprintStartDay', false, 1);

    // UI & Audit
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'color', 64, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'position', false, 0);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'lastModifiedBy', 256, false);

    // Custom Definitions (Stored as JSON strings)
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'customWorkItemTypes', 16384, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'customPriorities', 16384, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'customLabels', 16384, false);

    // Legacy Aliases (kept for back-compat during transition)
    await ensureEnumAttribute(databases, databaseId, COLLECTION_ID, 'methodology', ['scrum', 'kanban', 'hybrid'], false, 'scrum');
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'wipLimit', false, undefined, 0, 1000);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'prefix', 32, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'spaceId_idx', IndexType.Key, ['spaceId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'programId_idx', IndexType.Key, ['programId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'key_idx', IndexType.Key, ['key']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'status_idx', IndexType.Key, ['status']);
}
