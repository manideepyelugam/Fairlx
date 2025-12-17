/**
 * Migration Script: Workspace-Level to Project-Scoped RBAC
 * 
 * This script migrates existing data to the new project-scoped permission structure:
 * 1. Creates default teams ("General") for each project
 * 2. Creates default roles (Project Admin, Project Member, Viewer) for each project
 * 3. Migrates existing workspace members to project_members
 * 
 * Prerequisites:
 * - Create `project_members` collection in Appwrite
 * - Create `project_roles` collection in Appwrite
 * - Add collection IDs to .env.local
 * 
 * Usage: node scripts/migrate-to-project-rbac.js
 */

const sdk = require("node-appwrite");
require("dotenv").config({ path: ".env.local" });

// Initialize Appwrite client
const client = new sdk.Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new sdk.Databases(client);

// Collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const WORKSPACES_ID = process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID;
const MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID;
const PROJECTS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID;
const TEAMS_ID = process.env.NEXT_PUBLIC_APPWRITE_TEAMS_ID;
const PROJECT_MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_MEMBERS_ID;
const PROJECT_ROLES_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ROLES_ID;

// Default role permissions
const DEFAULT_ROLES = {
    PROJECT_ADMIN: {
        name: "Project Admin",
        description: "Full access to all project features",
        permissions: [
            "project.view",
            "project.settings.manage",
            "team.create",
            "team.manage",
            "member.invite",
            "member.remove",
            "task.create",
            "task.update",
            "task.delete",
            "task.assign",
            "sprint.view",
            "sprint.create",
            "sprint.update",
            "sprint.start",
            "sprint.complete",
            "sprint.delete",
            "board.view",
            "board.manage",
            "comment.create",
            "comment.delete",
            "role.create",
            "role.update",
            "role.delete",
            "reports.view",
            "reports.export",
        ],
        color: "blue",
        isDefault: true,
    },
    PROJECT_MEMBER: {
        name: "Project Member",
        description: "Can work on tasks, view sprints, and collaborate",
        permissions: [
            "project.view",
            "task.create",
            "task.update",
            "task.assign",
            "sprint.view",
            "board.view",
            "comment.create",
            "reports.view",
        ],
        color: "green",
        isDefault: true,
    },
    VIEWER: {
        name: "Viewer",
        description: "Read-only access to project content",
        permissions: [
            "project.view",
            "sprint.view",
            "board.view",
            "reports.view",
        ],
        color: "gray",
        isDefault: true,
    },
};

// Role mapping from old workspace roles to new project roles
const ROLE_MAPPING = {
    ADMIN: "PROJECT_ADMIN",
    OWNER: "PROJECT_ADMIN",
    PROJECT_ADMIN: "PROJECT_ADMIN",
    MANAGER: "PROJECT_MEMBER",
    DEVELOPER: "PROJECT_MEMBER",
    MEMBER: "PROJECT_MEMBER",
    VIEWER: "VIEWER",
};

async function main() {
    console.log("Starting migration to project-scoped RBAC...\n");

    try {
        // Step 1: Get all workspaces
        console.log("Step 1: Fetching workspaces...");
        const workspaces = await databases.listDocuments(DATABASE_ID, WORKSPACES_ID);
        console.log(`Found ${workspaces.total} workspace(s)\n`);

        for (const workspace of workspaces.documents) {
            console.log(`\n=== Processing Workspace: ${workspace.name} (${workspace.$id}) ===`);

            // Step 2: Get all projects in this workspace
            console.log("  Fetching projects...");
            const projects = await databases.listDocuments(DATABASE_ID, PROJECTS_ID, [
                sdk.Query.equal("workspaceId", workspace.$id),
            ]);
            console.log(`  Found ${projects.total} project(s)`);

            // Step 3: Get all workspace members
            console.log("  Fetching workspace members...");
            const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
                sdk.Query.equal("workspaceId", workspace.$id),
            ]);
            console.log(`  Found ${members.total} member(s)`);

            for (const project of projects.documents) {
                console.log(`\n  --- Project: ${project.name} (${project.$id}) ---`);

                // Step 4: Check if roles already exist for this project
                let existingRoles = { total: 0, documents: [] };
                try {
                    existingRoles = await databases.listDocuments(DATABASE_ID, PROJECT_ROLES_ID, [
                        sdk.Query.equal("projectId", project.$id),
                    ]);
                } catch (error) {
                    console.log("    Note: projectId attribute not found in project_roles collection, will create new roles");
                }

                let roleMap = {};

                if (existingRoles.total === 0) {
                    // Step 5: Create default roles for this project
                    console.log("    Creating default roles...");

                    for (const [roleKey, roleData] of Object.entries(DEFAULT_ROLES)) {
                        const role = await databases.createDocument(
                            DATABASE_ID,
                            PROJECT_ROLES_ID,
                            sdk.ID.unique(),
                            {
                                workspaceId: workspace.$id,
                                projectId: project.$id,
                                name: roleData.name,
                                description: roleData.description,
                                permissions: roleData.permissions,
                                color: roleData.color,
                                isDefault: roleData.isDefault,
                                createdBy: "migration-script",
                            }
                        );
                        roleMap[roleKey] = role.$id;
                        console.log(`      Created role: ${roleData.name}`);
                    }
                } else {
                    console.log(`    Roles already exist (${existingRoles.total}), skipping...`);
                    for (const role of existingRoles.documents) {
                        const key = Object.entries(DEFAULT_ROLES).find(
                            ([_, v]) => v.name === role.name
                        )?.[0];
                        if (key) {
                            roleMap[key] = role.$id;
                        }
                    }
                }

                // Step 6: Check if a default team exists for this project
                let defaultTeam;

                // Note: projectId attribute might not exist in teams collection yet
                // So we'll just create a new team for this project
                try {
                    const existingTeams = await databases.listDocuments(DATABASE_ID, TEAMS_ID, [
                        sdk.Query.equal("projectId", project.$id),
                    ]);

                    if (existingTeams.total > 0) {
                        defaultTeam = existingTeams.documents[0];
                        console.log(`    Using existing team: ${defaultTeam.name}`);
                    }
                } catch (error) {
                    // projectId attribute doesn't exist yet, will create new team
                    console.log("    Note: projectId attribute not found in teams collection");
                }

                if (!defaultTeam) {
                    console.log("    Creating default team 'General'...");
                    try {
                        defaultTeam = await databases.createDocument(
                            DATABASE_ID,
                            TEAMS_ID,
                            sdk.ID.unique(),
                            {
                                name: `General - ${project.name}`,
                                description: "Default project team",
                                workspaceId: workspace.$id,
                                projectId: project.$id,
                                visibility: "ALL",
                                createdBy: "migration-script",
                            }
                        );
                    } catch (createError) {
                        console.log("    Warning: Could not create team with projectId. Creating without it...");
                        // Try without projectId if the attribute doesn't exist
                        defaultTeam = await databases.createDocument(
                            DATABASE_ID,
                            TEAMS_ID,
                            sdk.ID.unique(),
                            {
                                name: `General - ${project.name}`,
                                description: "Default project team",
                                workspaceId: workspace.$id,
                                visibility: "ALL",
                                createdBy: "migration-script",
                            }
                        );
                        console.log("    ⚠️  Created team WITHOUT projectId. You'll need to add projectId attribute to teams collection and update teams manually.");
                    }
                }

                // Step 7: Migrate workspace members to project_members
                console.log("    Migrating members to project...");
                let migratedCount = 0;
                let skippedCount = 0;

                for (const member of members.documents) {
                    // Check if member already exists in project_members
                    let existingMembership = { total: 0 };
                    try {
                        existingMembership = await databases.listDocuments(
                            DATABASE_ID,
                            PROJECT_MEMBERS_ID,
                            [
                                sdk.Query.equal("userId", member.userId),
                                sdk.Query.equal("projectId", project.$id),
                            ]
                        );
                    } catch (error) {
                        // Attribute doesn't exist yet, assume no existing membership
                    }

                    if (existingMembership.total > 0) {
                        skippedCount++;
                        continue;
                    }

                    // Map old role to new role
                    const oldRole = member.role || "MEMBER";
                    const newRoleKey = ROLE_MAPPING[oldRole] || "PROJECT_MEMBER";
                    const newRoleId = roleMap[newRoleKey];

                    if (!newRoleId) {
                        console.log(`      Warning: No role mapping for ${oldRole}, skipping user ${member.userId}`);
                        skippedCount++;
                        continue;
                    }

                    // Create project_members entry
                    await databases.createDocument(
                        DATABASE_ID,
                        PROJECT_MEMBERS_ID,
                        sdk.ID.unique(),
                        {
                            workspaceId: workspace.$id,
                            projectId: project.$id,
                            teamId: defaultTeam.$id,
                            userId: member.userId,
                            roleId: newRoleId,
                            roleName: DEFAULT_ROLES[newRoleKey].name,
                            joinedAt: new Date().toISOString(),
                            addedBy: "migration-script",
                        }
                    );
                    migratedCount++;
                }

                console.log(`    Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
            }
        }

        console.log("\n\n========================================");
        console.log("Migration completed successfully!");
        console.log("========================================");
        console.log("\nNext steps:");
        console.log("1. Restart your development server");
        console.log("2. Test permissions in different projects");
        console.log("3. Remove the /settings/roles page once verified");

    } catch (error) {
        console.error("\n\nMigration failed:", error);
        process.exit(1);
    }
}

main();
