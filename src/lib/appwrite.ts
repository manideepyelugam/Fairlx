import "server-only";

import { Client, Account, Users, Databases, Storage, Messaging } from "node-appwrite";
import { cookies } from "next/headers";

import { AUTH_COOKIE } from "@/features/auth/constants";
import type { AppwriteConfig } from "@/lib/byob-resolver";

/**
 * Create an Appwrite session client for the current user.
 *
 * @param config Optional BYOB config — when provided, uses config.endpoint/project
 *               instead of process.env. All existing callers omit this param (Cloud flow).
 */
export async function createSessionClient(config?: AppwriteConfig) {
  const client = new Client()
    .setEndpoint(config?.endpoint ?? process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(config?.project ?? process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  const session = (await cookies()).get(AUTH_COOKIE);

  if (!session || !session.value) {
    throw new Error("Unauthorized");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}

/**
 * Create an Appwrite admin client with full API key access.
 *
 * @param config Optional BYOB config — when provided, uses config.endpoint/project/key
 *               instead of process.env. All existing callers omit this param (Cloud flow).
 */
export async function createAdminClient(config?: AppwriteConfig) {
  const client = new Client()
    .setEndpoint(config?.endpoint ?? process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(config?.project ?? process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(config?.key ?? process.env.NEXT_APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get users() {
      return new Users(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get messaging() {
      return new Messaging(client);
    },
  };
}
