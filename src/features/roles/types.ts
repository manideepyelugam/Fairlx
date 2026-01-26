import { Models } from "node-appwrite";

export type CustomRole = Models.Document & {
    workspaceId: string;
    name: string;
    roleName: string;
    description?: string;
    color?: string;
    permissions: string[];
    isDefault?: boolean;
    createdBy: string;
    lastModifiedBy?: string;
};
