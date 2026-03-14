/**
 * Storage Provider Factory
 * 
 * Auto-detects which storage backend to use based on environment variables:
 * - R2_ACCESS_KEY_ID present → Cloudflare R2 (production)
 * - Otherwise → Appwrite Storage (contributors / development)
 * 
 * Usage:
 *   import { getStorageProvider, isR2Enabled } from "@/lib/storage";
 *   
 *   // In API routes (session middleware gives you appwrite storage):
 *   const provider = getStorageProvider(c.get("storage"));
 *   await provider.uploadFile(bucketId, fileId, file);
 *   
 *   // In server functions (admin client):
 *   const { storage } = await createAdminClient();
 *   const provider = getStorageProvider(storage);
 */
import "server-only";

import type { Storage as AppwriteStorage } from "node-appwrite";
import type { StorageProvider } from "./types";

export type { StorageProvider, StorageFile } from "./types";

/**
 * Check if R2 is configured (i.e., production mode).
 */
export function isR2Enabled(): boolean {
  return !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_BUCKET_NAME
  );
}

/**
 * Cached R2 provider singleton (stateless, safe to reuse).
 */
let _r2Provider: StorageProvider | null = null;

// Lazy imports to avoid loading S3 SDK when not needed, while satisfying no-require-imports rule
let _r2Module: { R2StorageProvider: new () => StorageProvider } | null = null;
let _appwriteModule: { AppwriteStorageProvider: new (storage: AppwriteStorage) => StorageProvider } | null = null;

function await_r2Import(): { R2StorageProvider: new () => StorageProvider } {
  if (!_r2Module) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _r2Module = require("./r2-provider");
  }
  return _r2Module!;
}

function await_appwriteImport(): { AppwriteStorageProvider: new (storage: AppwriteStorage) => StorageProvider } {
  if (!_appwriteModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _appwriteModule = require("./appwrite-provider");
  }
  return _appwriteModule!;
}

/**
 * Get the active storage provider.
 * 
 * @param appwriteStorage - The Appwrite Storage instance (from session or admin client).
 *                          Only used when R2 is not configured.
 * @returns A StorageProvider instance (R2 or Appwrite)
 */
export function getStorageProvider(appwriteStorage?: AppwriteStorage): StorageProvider {
  if (isR2Enabled()) {
    if (!_r2Provider) {
      // Lazy-init R2 provider (module is imported at top level to satisfy ESLint)
      const { R2StorageProvider } = await_r2Import();
      _r2Provider = new R2StorageProvider();
    }
    return _r2Provider!;
  }

  if (!appwriteStorage) {
    throw new Error(
      "Storage not configured. Either set R2 environment variables or provide an Appwrite Storage instance."
    );
  }

  // Create Appwrite adapter on every call (it wraps a session-scoped client)
  const { AppwriteStorageProvider } = await_appwriteImport();
  return new AppwriteStorageProvider(appwriteStorage);
}

/**
 * Get the active storage provider using the admin client.
 * Useful for server-side operations that don't have a user session.
 */
export async function getAdminStorageProvider(): Promise<StorageProvider> {
  if (isR2Enabled()) {
    return getStorageProvider(); // R2 doesn't need appwrite storage
  }

  // Fall back to Appwrite admin client
  const { createAdminClient } = await import("@/lib/appwrite");
  const { storage } = await createAdminClient();
  return getStorageProvider(storage);
}
