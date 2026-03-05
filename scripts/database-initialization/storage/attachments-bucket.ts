import { Storage, Permission, Role, Compression } from 'node-appwrite';
import { ensureBucket } from '../lib/storage-helpers';
import { logger } from '../lib/logger';

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_ATTACHMENTS_BUCKET_ID || 'attachments_bucket';
const BUCKET_NAME = 'Attachments';

export async function setupAttachmentsBucket(storage: Storage): Promise<void> {
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
            // Images
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
            // Documents
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
            // Text
            'txt', 'csv', 'md', 'json', 'xml', 'yaml', 'yml',
            // Archives
            'zip', 'tar', 'gz', 'rar', '7z',
            // Code
            'js', 'ts', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'h', 'css', 'html',
            // Media
            'mp4', 'mp3', 'wav', 'ogg', 'webm',
        ],
        compression: Compression.Gzip,
        encryption: true,
        antivirus: true,
    });
}
