import "server-only";

import { Client, Databases, Storage, Users, ID, Query } from "node-appwrite";

import { DATABASE_ID, BYOB_TENANTS_ID } from "@/config";
import { encryptEnv, decryptEnv } from "@/lib/byob-crypto";
import { invalidateCachePattern } from "@/lib/redis/cache";
import { CKPattern } from "@/lib/redis/keys";
import {
    BYOBTenant,
    BYOBStatus,
    BYOBDbInitStatus,
    ValidateCredentialsResponse,
    ResolvedTenantInfo,
} from "../types";

// ===============================
// Helper: Get Fairlx admin databases
// ===============================

function getFairlxAdmin(): { databases: Databases; users: Users } {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
        .setKey(process.env.NEXT_APPWRITE_KEY!);

    return { databases: new Databases(client), users: new Users(client) };
}

// ===============================
// Register Tenant
// ===============================

export async function registerTenant(
    orgSlug: string,
    orgName: string,
    ownerUserId?: string
): Promise<BYOBTenant> {
    const { databases } = getFairlxAdmin();

    // Check slug uniqueness
    const existing = await databases.listDocuments(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        [Query.equal("orgSlug", orgSlug), Query.limit(1)]
    );

    if (existing.total > 0) {
        throw new Error(`Organisation slug "${orgSlug}" is already taken`);
    }

    const now = new Date().toISOString();

    const doc = await databases.createDocument(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        ID.unique(),
        {
            orgSlug,
            orgName,
            ownerUserId: ownerUserId || "pending",
            status: BYOBStatus.PENDING_SETUP,
            encryptedEnv: null,
            envIv: null,
            envTag: null,
            setupCompletedAt: null,
            dbInitStatus: BYOBDbInitStatus.NOT_STARTED,
            dbInitLog: null,
            createdAt: now,
            updatedAt: now,
        }
    );

    return doc as unknown as BYOBTenant;
}

// ===============================
// Validate Credentials
// ===============================

export async function validateCredentials(
    endpoint: string,
    project: string,
    apiKey: string
): Promise<ValidateCredentialsResponse> {
    try {
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(project)
            .setKey(apiKey);

        const databases = new Databases(client);
        const storage = new Storage(client);

        // 1. Test credentials by listing databases
        await databases.list();

        // 2. Check for free plan by testing storage bucket limits
        let isFreeAccount = false;
        let planWarning: string | undefined;

        try {
            // Try creating a temp bucket to test plan limits
            const testBucketId = `_plan_test_${Date.now()}`;
            await storage.createBucket(
                testBucketId,
                "Plan Test",
                undefined, // permissions
                false,     // fileSecurity
                true,      // enabled
                1,         // maximumFileSize (1 byte)
            );
            // Success — delete the test bucket immediately
            await storage.deleteBucket(testBucketId);
        } catch (bucketErr) {
            const bucketMsg = bucketErr instanceof Error ? bucketErr.message : String(bucketErr);
            if (
                bucketMsg.toLowerCase().includes("maximum number of buckets") ||
                bucketMsg.toLowerCase().includes("upgrade") ||
                bucketMsg.toLowerCase().includes("selected plan")
            ) {
                isFreeAccount = true;
                planWarning =
                    "Your Appwrite instance appears to be on a free plan. " +
                    "Fairlx requires at least 3 storage buckets and 60+ collections. " +
                    "Please upgrade to a paid Appwrite plan before continuing.";
            }
            // Other bucket errors (permissions, etc.) are OK — don't flag as free
        }

        return { valid: true, isFreeAccount, planWarning };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { valid: false, error: message };
    }
}

// ===============================
// Initialize Database
// ===============================

export interface InitResult {
    success: boolean;
    collectionsSucceeded: string[];
    collectionsFailed: string[];
    bucketsSucceeded: string[];
    bucketsFailed: string[];
    error?: string;
}

export interface ProgressInfo {
    message: string;
    step: number;
    total: number;
    phase?: "buckets" | "collections";
}

export async function initializeDatabase(
    orgSlug: string,
    envVars: Record<string, string>,
    onProgress?: (info: ProgressInfo) => void | Promise<void>
): Promise<InitResult> {
    const { databases: fairlxDatabases } = getFairlxAdmin();

    // 1. Look up the tenant
    const tenantResult = await fairlxDatabases.listDocuments(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        [Query.equal("orgSlug", orgSlug), Query.limit(1)]
    );

    if (tenantResult.total === 0) {
        throw new Error(`BYOB tenant not found: ${orgSlug}`);
    }

    const tenant = tenantResult.documents[0] as unknown as BYOBTenant;

    // 2. Encrypt and save the env blob
    const envJson = JSON.stringify(envVars);
    const { encrypted, iv, tag } = encryptEnv(envJson);

    await fairlxDatabases.updateDocument(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        tenant.$id,
        {
            encryptedEnv: encrypted,
            envIv: iv,
            envTag: tag,
            status: BYOBStatus.SETUP_IN_PROGRESS,
            dbInitStatus: BYOBDbInitStatus.IN_PROGRESS,
            updatedAt: new Date().toISOString(),
        }
    );

    await onProgress?.({ message: "✅ Credentials encrypted and saved", step: 1, total: 0 });

    // 3. Create Appwrite client for the customer's instance
    const customerClient = new Client()
        .setEndpoint(envVars.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(envVars.NEXT_PUBLIC_APPWRITE_PROJECT)
        .setKey(envVars.NEXT_APPWRITE_KEY);

    const customerDatabases = new Databases(customerClient);
    const customerStorage = new Storage(customerClient);
    const databaseId = envVars.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "fairlx";

    // 4. Ensure the database exists
    await onProgress?.({ message: "📦 Creating database...", step: 2, total: 0 });
    try {
        await customerDatabases.get(databaseId);
        await onProgress?.({ message: "✅ Database already exists", step: 2, total: 0 });
    } catch {
        try {
            await customerDatabases.create(databaseId, "Fairlx");
            await onProgress?.({ message: "✅ Database created", step: 2, total: 0 });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            await onProgress?.({ message: `❌ Failed to create database: ${msg}`, step: 2, total: 0 });
        }
    }

    // 5. Dynamically import and run setup functions
    // We import lazily to avoid pulling in CLI dependencies at module load
    const { runCollectionSetups, runBucketSetups } = await import(
        "../../../../scripts/database-initialization/setup-runner"
    );

    await onProgress?.({ message: "📦 Setting up storage buckets...", step: 3, total: 0 });
    const bucketResult = await runBucketSetups(
        customerStorage,
        async (name: string, index: number, total: number) => {
            await onProgress?.({ message: `🪣 ${name}`, step: index, total, phase: "buckets" });
        }
    );

    await onProgress?.({ message: "📦 Setting up collections...", step: 0, total: 0 });
    const collectionResult = await runCollectionSetups(
        customerDatabases,
        databaseId,
        async (name: string, index: number, total: number) => {
            await onProgress?.({ message: `📦 ${name}`, step: index, total, phase: "collections" });
        }
    );

    // 6. Update tenant status
    const allSuccess =
        collectionResult.failed.length === 0 && bucketResult.failed.length === 0;

    const logLines = [
        `Buckets: ${bucketResult.succeeded.length} OK, ${bucketResult.failed.length} failed`,
        `Collections: ${collectionResult.succeeded.length} OK, ${collectionResult.failed.length} failed`,
        ...(bucketResult.failed.length > 0
            ? [`Failed buckets: ${bucketResult.failed.join(", ")}`]
            : []),
        ...(collectionResult.failed.length > 0
            ? [`Failed collections: ${collectionResult.failed.join(", ")}`]
            : []),
    ];

    await fairlxDatabases.updateDocument(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        tenant.$id,
        {
            status: allSuccess ? BYOBStatus.ACTIVE : BYOBStatus.SETUP_IN_PROGRESS,
            dbInitStatus: allSuccess
                ? BYOBDbInitStatus.COMPLETED
                : BYOBDbInitStatus.FAILED,
            dbInitLog: logLines.join("\n"),
            setupCompletedAt: allSuccess ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
        }
    );

    // Invalidate cache for this tenant
    await invalidateCachePattern(CKPattern.byobTenant(orgSlug));

    // Store byobOrgSlug in owner's user prefs so session-middleware can detect BYOB
    if (allSuccess && tenant.ownerUserId &&
        tenant.ownerUserId !== "anonymous" &&
        tenant.ownerUserId !== "pending") {
        try {
            const { users } = getFairlxAdmin();
            // Merge with existing prefs to avoid overwriting
            const existingUser = await users.get(tenant.ownerUserId);
            const existingPrefs = existingUser.prefs || {};
            await users.updatePrefs(tenant.ownerUserId, {
                ...existingPrefs,
                byobOrgSlug: orgSlug,
                deploymentTier: "BYOB",
            });
        } catch {
            // Non-fatal — user can still use BYOB, prefs update is best-effort
        }
    }

    const statusMsg = allSuccess
        ? "✅ Database initialization complete! Your backend is ready."
        : "⚠️ Some items failed. You can re-run initialization.";
    await onProgress?.({ message: statusMsg, step: 0, total: 0 });

    return {
        success: allSuccess,
        collectionsSucceeded: collectionResult.succeeded,
        collectionsFailed: collectionResult.failed,
        bucketsSucceeded: bucketResult.succeeded,
        bucketsFailed: bucketResult.failed,
    };
}

// ===============================
// Resolve Tenant (public-safe)
// ===============================

export async function resolveTenant(
    orgSlug: string
): Promise<ResolvedTenantInfo> {
    const { databases } = getFairlxAdmin();

    const result = await databases.listDocuments(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        [Query.equal("orgSlug", orgSlug), Query.limit(1)]
    );

    if (result.total === 0) {
        throw new Error(`Organisation not found: ${orgSlug}`);
    }

    const tenant = result.documents[0] as unknown as BYOBTenant;

    // For resolve, we need to decrypt to get endpoint/project (but never expose the key)
    if (!tenant.encryptedEnv || !tenant.envIv || !tenant.envTag) {
        return {
            orgSlug: tenant.orgSlug,
            orgName: tenant.orgName,
            appwriteEndpoint: "",
            appwriteProject: "",
            status: tenant.status,
            ownerUserId: tenant.ownerUserId,
        };
    }

    const envJson = decryptEnv(
        tenant.encryptedEnv,
        tenant.envIv,
        tenant.envTag
    );
    const env = JSON.parse(envJson) as Record<string, string>;

    return {
        orgSlug: tenant.orgSlug,
        orgName: tenant.orgName,
        appwriteEndpoint: env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        appwriteProject: env.NEXT_PUBLIC_APPWRITE_PROJECT,
        status: tenant.status,
        ownerUserId: tenant.ownerUserId,
    };
}

// ===============================
// Get Tenant by Owner
// ===============================

export async function getTenantByOwner(
    ownerUserId: string
): Promise<BYOBTenant | null> {
    const { databases } = getFairlxAdmin();

    const result = await databases.listDocuments(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        [Query.equal("ownerUserId", ownerUserId), Query.limit(1)]
    );

    if (result.total === 0) return null;
    return result.documents[0] as unknown as BYOBTenant;
}

// ===============================
// Get Tenant by Slug (public lookup for member registration)
// ===============================

export async function getBYOBTenantBySlug(
    orgSlug: string
): Promise<BYOBTenant | null> {
    const { databases } = getFairlxAdmin();

    const result = await databases.listDocuments(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        [Query.equal("orgSlug", orgSlug), Query.limit(1)]
    );

    if (result.total === 0) return null;
    return result.documents[0] as unknown as BYOBTenant;
}

// ===============================
// Set Tenant Owner
// Called after owner account is created (Step 4)
// ===============================

export async function setTenantOwner(
    tenantDocId: string,
    ownerUserId: string
): Promise<void> {
    const { databases } = getFairlxAdmin();
    await databases.updateDocument(
        DATABASE_ID,
        BYOB_TENANTS_ID,
        tenantDocId,
        {
            ownerUserId,
            updatedAt: new Date().toISOString(),
        }
    );
}
