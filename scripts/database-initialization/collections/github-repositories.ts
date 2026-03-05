import { Databases, IndexType, Permission, Role } from 'node-appwrite';
import {
    ensureCollection,
    ensureStringAttribute,
    ensureBooleanAttribute,
    ensureDatetimeAttribute,
    ensureIndex,
    sleep,
} from '../lib/db-helpers';
import { logger } from '../lib/logger';

const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_GITHUB_REPOS_ID || 'github_repositories';
const COLLECTION_NAME = 'GitHub Repositories';

export async function setupGithubRepositories(databases: Databases, databaseId: string): Promise<void> {
    logger.collection(COLLECTION_NAME);

    await ensureCollection(databases, databaseId, COLLECTION_ID, COLLECTION_NAME, [
        Permission.read(Role.any()),
    ]);

    // Attributes
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'projectId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'workspaceId', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'repoOwner', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'repoName', 256, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'repoUrl', 1024, false);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'defaultBranch', 256, false, 'main');
    await ensureDatetimeAttribute(databases, databaseId, COLLECTION_ID, 'lastSyncedAt', false);
    await ensureBooleanAttribute(databases, databaseId, COLLECTION_ID, 'isActive', false, true);
    await ensureStringAttribute(databases, databaseId, COLLECTION_ID, 'encryptedToken', 1024, false);

    await sleep(2000);

    // Indexes
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'projectId_idx', IndexType.Key, ['projectId']);
    await ensureIndex(databases, databaseId, COLLECTION_ID, 'workspaceId_idx', IndexType.Key, ['workspaceId']);
}
