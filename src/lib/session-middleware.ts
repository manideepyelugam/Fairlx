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

type AdditionalContext = {
  Variables: {
    account: AccountType;
    databases: DatabasesType;
    storage: StorageType;
    users: UsersType;
    messaging: MessagingType;
    user: Models.User<Models.Preferences>;
  };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(
  async (c, next) => {
    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

      const session = getCookie(c, AUTH_COOKIE);

      if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      client.setSession(session);

      const account = new Account(client);
      const databases = new Databases(client);
      const storage = new Storage(client);
      const messaging = new Messaging(client);

      const user = await account.get();

      c.set("account", account);
      c.set("databases", databases);
      c.set("storage", storage);
      c.set("messaging", messaging);
      c.set("user", user);

      await next();
    } catch (error: unknown) {
      // Only return 401 for authentication errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isAuthError = (error as any)?.code === 401 || (error as any)?.message?.includes("Unauthorized");
      if (isAuthError) {
        return c.json({ error: "Session expired or invalid" }, 401);
      }

      // Re-throw other errors (like database or Razorpay errors) so they can be handled by the route or global error handler
      throw error;
    }
  }
);

export async function getSessionUser(c: Context) {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

    const session = getCookie(c, AUTH_COOKIE);
    if (!session) return null;

    client.setSession(session);
    const account = new Account(client);
    return await account.get();
  } catch {
    return null;
  }
}
