import { Models } from "node-appwrite";
import type {
  Account as AccountType,
  Databases as DatabasesType,
  Storage as StorageType,
  Users as UsersType,
} from "node-appwrite";

declare module "hono" {
  interface ContextVariableMap {
    account: AccountType;
    databases: DatabasesType;
    storage: StorageType;
    users: UsersType;
    user: Models.User<Models.Preferences>;
  }
}