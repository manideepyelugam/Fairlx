import { Models } from "node-appwrite";
import type {
  Account as AccountType,
  Databases as DatabasesType,
  Storage as StorageType,
  Users as UsersType,
  Messaging as MessagingType,
} from "node-appwrite";

declare module "hono" {
  interface ContextVariableMap {
    account: AccountType;
    databases: DatabasesType;
    storage: StorageType;
    users: UsersType;
    messaging: MessagingType;
    user: Models.User<Models.Preferences>;
    /** True when request originates from a BYOB tenant */
    isByob: boolean;
    /** Correct database ID for Cloud or BYOB context */
    databaseId: string;
  }
}