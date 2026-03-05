import { Storage, Permission, Role, Compression } from 'node-appwrite';
import { ensureBucket } from '../lib/storage-helpers';
import { logger } from '../lib/logger';

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_DOCS_BUCKET_ID || 'project-docs';
const BUCKET_NAME = 'Project Documents';

export async function setupProjectDocsBucket(storage: Storage): Promise<void> {
    logger.collection(BUCKET_NAME);

    await ensureBucket(storage, BUCKET_ID, BUCKET_NAME, {
        permissions: [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ],
        fileSecurity: false,
        maximumFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileExtensions: [
            // Documents
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'odt', 'ods', 'odp', 'rtf',
            // Text
            'txt', 'csv', 'md', 'json', 'xml', 'yaml', 'yml',
            // Images (for embedded images in docs)
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
            // Archives
            'zip', 'tar', 'gz',
        ],
        compression: Compression.Gzip,
        encryption: true,
        antivirus: true,
    });
}
