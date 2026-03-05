import { Storage, Compression } from 'node-appwrite';
import { logger } from './logger';

/** Sleep helper for rate limiting */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if an error is an Appwrite error with a specific code */
function isAppwriteError(err: unknown, code: number): boolean {
    if (err && typeof err === 'object' && 'code' in err) {
        return (err as { code: number }).code === code;
    }
    return false;
}

// ─── Bucket ──────────────────────────────────────────────────

export async function ensureBucket(
    storage: Storage,
    bucketId: string,
    name: string,
    options?: {
        permissions?: string[];
        fileSecurity?: boolean;
        enabled?: boolean;
        maximumFileSize?: number;       // bytes
        allowedFileExtensions?: string[];
        compression?: Compression;
        encryption?: boolean;
        antivirus?: boolean;
    }
): Promise<void> {
    try {
        await storage.getBucket(bucketId);
        logger.skipped('bucket', name);
    } catch (err) {
        if (isAppwriteError(err, 404)) {
            try {
                await storage.createBucket(
                    bucketId,
                    name,
                    options?.permissions,
                    options?.fileSecurity ?? false,
                    options?.enabled ?? true,
                    options?.maximumFileSize,
                    options?.allowedFileExtensions,
                    options?.compression ?? Compression.None,
                    options?.encryption ?? true,
                    options?.antivirus ?? true
                );
                logger.created('bucket', name);
                await sleep(300);
            } catch (createErr) {
                if (isAppwriteError(createErr, 409)) {
                    logger.skipped('bucket', name);
                } else {
                    logger.error('bucket', name, createErr);
                    throw createErr;
                }
            }
        } else {
            logger.error('bucket', name, err);
            throw err;
        }
    }
}
