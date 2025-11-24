import { openDB, IDBPDatabase } from "idb";

import { CommitSummary } from "../types/commit";

const DB_NAME = "githubIntegration";
const STORE_NAME = "commitSummaries";
const DB_VERSION = 1;
const LEGACY_COMMITS_KEY = (projectId: string) => `commits_${projectId}`;
const LEGACY_COMMITS_COUNT_KEY = (projectId: string) => `commits_count_${projectId}`;
export const COMMIT_CACHE_CHANNEL = "commit-cache";

type CommitCacheRecord = {
  key: string;
  projectId: string;
  commit: CommitSummary;
};

let dbPromise: Promise<IDBPDatabase | null> | null = null;

const isBrowser = () => typeof window !== "undefined";

const isIndexedDBAvailable = () => isBrowser() && typeof window.indexedDB !== "undefined";

const getDb = async (): Promise<IDBPDatabase | null> => {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "key",
          });
          store.createIndex("projectId", "projectId", { unique: false });
        }
      },
    }).catch((error) => {
      console.error("[CommitCache] Failed to open IndexedDB", error);
      return null;
    });
  }

  return dbPromise;
};

const buildKey = (projectId: string, hash: string) => `${projectId}::${hash}`;

const deleteProjectEntries = async (db: IDBPDatabase, projectId: string) => {
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("projectId");

  for (let cursor = await index.openCursor(projectId); cursor; cursor = await cursor.continue()) {
    await cursor.delete();
  }

  await tx.done;
};

export async function saveCommitsToCache(projectId: string, commits: CommitSummary[]) {
  const db = await getDb();
  if (!db) {
    return;
  }

  await deleteProjectEntries(db, projectId);

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await Promise.all(
    commits.map((commit) =>
      store.put({
        key: buildKey(projectId, commit.hash),
        projectId,
        commit,
      } satisfies CommitCacheRecord)
    )
  );

  await tx.done;
}

export async function loadCommitsFromCache(projectId: string): Promise<CommitSummary[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("projectId");
  const records = (await index.getAll(projectId)) as CommitCacheRecord[];

  return records.map((record) => record.commit);
}

export async function getCommitsCount(projectId: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("projectId");
  const count = await index.count(projectId);
  await tx.done;

  return count;
}

export async function clearCommitsCache(projectId: string) {
  const db = await getDb();
  if (!db) {
    return;
  }

  await deleteProjectEntries(db, projectId);
}

export function readLegacyCommits(projectId: string): CommitSummary[] {
  if (!isBrowser()) {
    return [];
  }

  const cached = window.localStorage.getItem(LEGACY_COMMITS_KEY(projectId));
  if (!cached) {
    return [];
  }

  try {
    const parsed = JSON.parse(cached) as CommitSummary[];
    return parsed.filter(
      (commit) => commit.hash && commit.message && commit.author && commit.date
    );
  } catch (error) {
    console.error("[CommitCache] Failed to parse legacy commits", error);
    return [];
  }
}

export function readLegacyCommitsCount(projectId: string): number {
  if (!isBrowser()) {
    return 0;
  }

  const count = window.localStorage.getItem(LEGACY_COMMITS_COUNT_KEY(projectId));
  return count ? parseInt(count, 10) || 0 : 0;
}

export function clearLegacyCommits(projectId: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(LEGACY_COMMITS_KEY(projectId));
  window.localStorage.removeItem(LEGACY_COMMITS_COUNT_KEY(projectId));
}

export function notifyCommitsUpdated(projectId: string) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent("commitsUpdated", { detail: { projectId } }));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(COMMIT_CACHE_CHANNEL);
    channel.postMessage({ type: "updated", projectId });
    channel.close();
  }
}
