import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureIntegerAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CODE_DOCS_ID || 'code_documentation';
const COLLECTION_NAME = 'Code Documentation';

export async function setupCodeDocumentation(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'content', 65535, true); // Main documentation text
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'generatedAt', 128, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'fileStructure', 65535, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'mermaidDiagram', 65535, false);
    
    // Legacy support (optional, from previous individual file approach)
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'repoId', 256, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'filePath', 1024, false); // No longer required
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'language', 64, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'summary', 65535, false);
    await ensureIntegerAttribute(databases, databaseId, COLLECTION_ID, 'tokenCount', false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'repoId_idx', IndexType.Key, ['repoId']);
}
