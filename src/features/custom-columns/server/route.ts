import { Query } from "node-appwrite";
import { DATABASE_ID, CUSTOM_COLUMNS_ID } from "@/config";
import { createSessionClient } from "@/lib/appwrite";

export const getCustomColumns = async ({
  workspaceId,
}: {
  workspaceId: string;
}) => {
  const { databases } = await createSessionClient();

  const customColumns = await databases.listDocuments(DATABASE_ID, CUSTOM_COLUMNS_ID, [
    Query.equal("workspaceId", workspaceId),
    Query.orderAsc("position"),
  ]);

  return customColumns;
};
