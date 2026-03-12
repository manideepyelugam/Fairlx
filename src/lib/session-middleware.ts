import "server-only";

import {
  Account,
  Client,
  Databases,
  Models,
  Storage,
  Messaging,
  type Account as AccountType,
  type Databases as DatabasesType,
  type Storage as StorageType,
  type Users as UsersType,
  type Messaging as MessagingType,
} from "node-appwrite";

import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { resolveAppwriteConfig } from "@/lib/byob-resolver";

type AdditionalContext = {
  Variables: {
    account: AccountType;
    databases: DatabasesType;
    storage: StorageType;
    users: UsersType;
    messaging: MessagingType;
    user: Models.User<Models.Preferences>;
    isByob: boolean;
    databaseId: string;
  };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(
  async (c, next) => {
    try {
      // Always authenticate against Fairlx (centralized identity)
      const authClient = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

      const session = getCookie(c, AUTH_COOKIE);

      if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      authClient.setSession(session);

      const account = new Account(authClient);
      const user = await account.get();

      // Detect BYOB user via prefs (set during BYOB setup completion)
      const byobOrgSlug = user.prefs?.byobOrgSlug as string | undefined;

      let dataClient: Client;

      if (byobOrgSlug) {
        // BYOB user — resolve their Appwrite config for data operations
        const byobConfig = await resolveAppwriteConfig(byobOrgSlug);
        dataClient = new Client()
          .setEndpoint(byobConfig.endpoint)
          .setProject(byobConfig.project)
          .setKey(byobConfig.key); // Admin key for server-side data ops

        c.set("isByob", true);
        c.set("databaseId", byobConfig.databaseId);
      } else {
        // Cloud user — data client uses admin key (collections only grant read to Role.any())
        dataClient = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
          .setKey(process.env.NEXT_APPWRITE_KEY!);

        c.set("isByob", false);
        c.set("databaseId", process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!);
      }

      const databases = new Databases(dataClient);
      const storage = new Storage(dataClient);
      const messaging = new Messaging(dataClient);

      c.set("account", account);    // Always Fairlx account (auth)
      c.set("databases", databases); // Cloud: Fairlx DB | BYOB: customer DB
      c.set("storage", storage);
      c.set("messaging", messaging);
      c.set("user", user);

      await next();
    } catch (error: unknown) {
      // Only return 401 for authentication errors
      const isAuthError = (error as { code?: number })?.code === 401;
      if (isAuthError) {
        return c.json({ error: "Session expired or invalid" }, 401);
      }

      // Re-throw other errors so they can be handled by the route or global error handler
      throw error;
    }
  }
);

/**
 * Get the current session user from the middleware context.
 * This avoids duplicating client setup logic from sessionMiddleware.
 * 
 * @param c - Hono context (must have passed through sessionMiddleware)
 * @returns The user object if authenticated, or null
 */
export function getSessionUser(c: Context): Models.User<Models.Preferences> | null {
  try {
    // Derive user from middleware context instead of recreating client
    return c.get("user") ?? null;
  } catch {
    return null;
  }
}
