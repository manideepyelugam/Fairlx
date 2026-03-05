import { Client, Databases, Storage } from 'node-appwrite';

let _client: Client | null = null;
let _databases: Databases | null = null;
let _storage: Storage | null = null;

/**
 * Lazily initializes the Appwrite client.
 * Called AFTER interactive setup ensures env vars are populated.
 */
function initClient(): { client: Client; databases: Databases; storage: Storage } {
    if (_client && _databases && _storage) {
        return { client: _client, databases: _databases, storage: _storage };
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
    const key = process.env.NEXT_APPWRITE_KEY;

    if (!endpoint || !project || !key) {
        console.error('❌ Missing required environment variables:');
        if (!endpoint) console.error('   - NEXT_PUBLIC_APPWRITE_ENDPOINT');
        if (!project) console.error('   - NEXT_PUBLIC_APPWRITE_PROJECT');
        if (!key) console.error('   - NEXT_APPWRITE_KEY');
        process.exit(1);
    }

    _client = new Client()
        .setEndpoint(endpoint)
        .setProject(project)
        .setKey(key);

    _databases = new Databases(_client);
    _storage = new Storage(_client);

    return { client: _client, databases: _databases, storage: _storage };
}

/**
 * Get the initialized Databases instance.
 * Must be called after interactive setup has completed.
 */
export function getDatabases(): Databases {
    return initClient().databases;
}

/**
 * Get the initialized Storage instance.
 * Must be called after interactive setup has completed.
 */
export function getStorage(): Storage {
    return initClient().storage;
}

/**
 * Get the initialized Client instance.
 * Must be called after interactive setup has completed.
 */
export function getClient(): Client {
    return initClient().client;
}
