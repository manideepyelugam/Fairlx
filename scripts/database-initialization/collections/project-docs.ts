import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureIntegerAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_DOCS_ID || 'project_docs';
const COLLECTION_NAME = 'Project Docs';

export async function setupProjectDocs(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'name', 512, true); // Matches doc.name in code
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'category', 128, true); // Added category
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'size', true); // Matches doc.size in code
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'mimeType', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'fileId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'uploadedBy', 256, true);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isArchived', false, false); // Added isArchived for queries
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'description', 4096, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'version', 64, false, '1.0.0');
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'tags', 256, false, undefined, true); // Array of tags
    
    // Legacy support (optional)
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'title', 512, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'fileSize', false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isProcessed', false, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'aiSummary', 65535, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
}
