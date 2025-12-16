const { Client, Databases, Permission, Role: AppwriteRole } = require('node-appwrite');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const API_KEY = process.env.NEXT_APPWRITE_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const CUSTOM_ROLES_ID = process.env.NEXT_PUBLIC_APPWRITE_CUSTOM_ROLES_ID;

// If CUSTOM_ROLES_ID is missing, we might need to rely on the user to provide it or create a new one.
// For this script, we assume it's set in env.

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID || !CUSTOM_ROLES_ID) {
    console.error("Missing Environment Variables. Please check .env");
    console.log({ ENDPOINT, PROJECT_ID, hasKey: !!API_KEY, DATABASE_ID, CUSTOM_ROLES_ID });
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function setup() {
    console.log("Setting up RBAC Schema...");

    // 1. Ensure 'workspace_roles' collection exists
    try {
        await databases.getCollection(DATABASE_ID, CUSTOM_ROLES_ID);
        console.log(`Collection ${CUSTOM_ROLES_ID} (workspace_roles) already exists.`);
    } catch (error) {
        if (error.code === 404) {
            console.log(`Creating collection ${CUSTOM_ROLES_ID}...`);
            await databases.createCollection(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                "Workspace Roles",
                [
                    Permission.read(AppwriteRole.any()), // Adjust as needed
                    Permission.write(AppwriteRole.users()), // Authenticated users can write? Maybe only admins.
                ]
            );
        } else {
            throw error;
        }
    }

    // 2. Ensure Attributes exist
    const attributes = [
        { key: "workspaceId", type: "string", size: 50, required: true },
        { key: "name", type: "string", size: 50, required: true }, // Changed from roleName to name
        { key: "permissions", type: "string", size: 5000, required: true, array: true }, // Size 5000 to match screenshot
    ];

    const existingAttrsResponse = await databases.listAttributes(DATABASE_ID, CUSTOM_ROLES_ID);
    const existingAttrs = existingAttrsResponse.attributes.map(a => a.key);

    for (const attr of attributes) {
        if (!existingAttrs.includes(attr.key)) {
            console.log(`Creating attribute ${attr.key}...`);
            await databases.createStringAttribute(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                attr.key,
                attr.size,
                attr.required,
                undefined, // default
                attr.array
            );
            // Brief wait to ensure availability (Appwrite async attribute creation)
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            console.log(`Attribute ${attr.key} already exists.`);
        }
    }

    // Fix for conflict with Team Custom Roles: Ensure teamId is optional
    if (existingAttrs.includes("teamId")) {
        console.log("Checking teamId attribute...");
        try {
            await databases.updateStringAttribute(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                "teamId",
                false // required = false
            );
            console.log("Updated teamId to be optional.");
            // Wait for attribute update to propagate
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.log("Note: Could not update teamId (might already be optional or busy):", e.message);
        }
    }

    // 3. Create Indexes
    // Unique constraint on [workspaceId, roleName] might be good
    const existingIndexesResponse = await databases.listIndexes(DATABASE_ID, CUSTOM_ROLES_ID);
    const existingIndexKeys = existingIndexesResponse.indexes.map(i => i.key);

    const indexKey = "unique_role_per_workspace";
    const hasIndex = existingIndexesResponse.indexes.some(i => i.key === indexKey);

    if (!hasIndex) {
        console.log(`Creating index ${indexKey}...`);
        // check if we can create it (attributes must be available)
        // We'll try, if it fails, user might need to wait.
        try {
            await databases.createIndex(
                DATABASE_ID,
                CUSTOM_ROLES_ID,
                indexKey,
                "unique",
                ["workspaceId", "roleName"],
                ["ASC", "ASC"]
            );
        } catch (e) {
            console.warn("Could not create index yet (attributes might be processing):", e.message);
        }
    }
    console.log("RBAC Schema Setup Complete.");
}

setup().catch(console.error);
