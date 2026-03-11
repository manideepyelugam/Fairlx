import { Models } from "node-appwrite";

// ===============================
// BYOB Status Enums
// ===============================

export enum BYOBStatus {
    PENDING_SETUP = "PENDING_SETUP",
    SETUP_IN_PROGRESS = "SETUP_IN_PROGRESS",
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
}

export enum BYOBDbInitStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

// ===============================
// BYOB Tenant Document
// ===============================

export interface BYOBTenant extends Models.Document {
    orgSlug: string;
    orgName: string;
    ownerUserId: string;
    status: BYOBStatus;
    encryptedEnv: string | null;
    envIv: string | null;
    envTag: string | null;
    setupCompletedAt: string | null;
    dbInitStatus: BYOBDbInitStatus;
    dbInitLog: string | null;
    createdAt: string;
    updatedAt: string;
}

// ===============================
// Setup Stepper
// ===============================

export enum BYOBSetupStep {
    CREATE_ORG = 0,
    APPWRITE_CREDENTIALS = 1,
    ADDITIONAL_CONFIG = 2,
    DB_INITIALIZATION = 3,
    OWNER_ACCOUNT = 4,
}

// ===============================
// API Request/Response Types
// ===============================

export interface ValidateCredentialsRequest {
    endpoint: string;
    project: string;
    apiKey: string;
}

export interface ValidateCredentialsResponse {
    valid: boolean;
    error?: string;
    isFreeAccount?: boolean;
    planWarning?: string;
}

export interface RegisterTenantRequest {
    orgSlug: string;
    orgName: string;
}

export interface InitializeDbRequest {
    orgSlug: string;
    envVars: Record<string, string>;
}

export interface ResolvedTenantInfo {
    orgSlug: string;
    orgName: string;
    appwriteEndpoint: string;
    appwriteProject: string;
    status: BYOBStatus;
    ownerUserId: string;
}
