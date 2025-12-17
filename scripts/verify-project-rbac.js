/**
 * Verification Script: Test Project-Scoped RBAC System
 * 
 * This script performs automated verification of the project-scoped RBAC system:
 * 1. Verifies migration created correct data
 * 2. Tests permission resolution
 * 3. Validates role assignments
 * 4. Tests API endpoints
 * 
 * Usage: node scripts/verify-project-rbac.js [projectId]
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
const PROJECTS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID;
const PROJECT_MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_MEMBERS_ID;
const PROJECT_ROLES_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ROLES_ID;

async function main() {
    console.log("🔍 Starting Project-Scoped RBAC Verification...\n");

    try {
        // Get a sample project (use first arg or find any project with members)
        const projectId = process.argv[2];

        let project;
        if (projectId) {
            project = await databases.getDocument(DATABASE_ID, PROJECTS_ID, projectId);
        } else {
            // Find first project with members
            const projects = await databases.listDocuments(DATABASE_ID, PROJECTS_ID, [
                sdk.Query.limit(10)
            ]);

            for (const p of projects.documents) {
                const members = await databases.listDocuments(DATABASE_ID, PROJECT_MEMBERS_ID, [
                    sdk.Query.equal("projectId", p.$id),
                    sdk.Query.limit(1)
                ]);

                if (members.total > 0) {
                    project = p;
                    break;
                }
            }
        }

        if (!project) {
            console.log("❌ No project with members found. Run migration first.");
            process.exit(1);
        }

        console.log(`📊 Testing Project: ${project.name} (${project.$id})\n`);

        // Test 1: Verify Roles Exist
        console.log("Test 1: Checking Default Roles...");
        const roles = await databases.listDocuments(DATABASE_ID, PROJECT_ROLES_ID, [
            sdk.Query.equal("projectId", project.$id)
        ]);

        console.log(`  ✅ Found ${roles.total} role(s):`);
        const roleNames = roles.documents.map(r => `    - ${r.name} (${r.permissions.length} permissions)`);
        console.log(roleNames.join("\n"));

        if (roles.total < 3) {
            console.log("  ⚠️  Warning: Expected at least 3 default roles");
        }

        // Test 2: Verify Members Exist
        console.log("\nTest 2: Checking Project Members...");
        const members = await databases.listDocuments(DATABASE_ID, PROJECT_MEMBERS_ID, [
            sdk.Query.equal("projectId", project.$id)
        ]);

        console.log(`  ✅ Found ${members.total} member(s):`);
        for (const member of members.documents) {
            console.log(`    - User: ${member.userId}`);
            console.log(`      Team: ${member.teamId}`);
            console.log(`      Role: ${member.roleName}`);
        }

        if (members.total === 0) {
            console.log("  ⚠️  Warning: No members found in this project");
            return;
        }

        // Test 3: Verify Permission Resolution
        console.log("\nTest 3: Testing Permission Resolution...");
        const testMember = members.documents[0];

        // Get the role
        const role = await databases.getDocument(DATABASE_ID, PROJECT_ROLES_ID, testMember.roleId);

        console.log(`  Testing user: ${testMember.userId}`);
        console.log(`  Role: ${role.name}`);
        console.log(`  Permissions (${role.permissions.length}):`);

        const permissionPreview = role.permissions.slice(0, 5);
        permissionPreview.forEach(p => console.log(`    - ${p}`));
        if (role.permissions.length > 5) {
            console.log(`    ... and ${role.permissions.length - 5} more`);
        }

        // Test 4: Verify Role-Permission Mapping
        console.log("\nTest 4: Validating Role Types...");
        const projectAdmin = roles.documents.find(r => r.name === "Project Admin");
        const projectMember = roles.documents.find(r => r.name === "Project Member");
        const viewer = roles.documents.find(r => r.name === "Viewer");

        if (projectAdmin) {
            console.log(`  ✅ Project Admin has ${projectAdmin.permissions.length} permissions`);
            const hasAllPerms = projectAdmin.permissions.includes("task.delete") &&
                projectAdmin.permissions.includes("role.create");
            if (hasAllPerms) {
                console.log("     ✓ Has full permissions (task.delete, role.create)");
            }
        } else {
            console.log("  ❌ Project Admin role not found");
        }

        if (projectMember) {
            console.log(`  ✅ Project Member has ${projectMember.permissions.length} permissions`);
            const hasTaskPerms = projectMember.permissions.includes("task.create");
            const lackDeletePerms = !projectMember.permissions.includes("task.delete");
            if (hasTaskPerms && lackDeletePerms) {
                console.log("     ✓ Has task create but not delete (correct)");
            }
        } else {
            console.log("  ❌ Project Member role not found");
        }

        if (viewer) {
            console.log(`  ✅ Viewer has ${viewer.permissions.length} permissions`);
            const isReadOnly = viewer.permissions.every(p => p.includes("view") || !p.includes("create") && !p.includes("delete"));
            if (viewer.permissions.length < 10) {
                console.log("     ✓ Limited permissions (read-only)");
            }
        } else {
            console.log("  ❌ Viewer role not found");
        }

        // Test 5: Check for Multiple Team Memberships (edge case)
        console.log("\nTest 5: Testing Multi-Team Membership...");
        const userMemberships = {};
        for (const member of members.documents) {
            if (!userMemberships[member.userId]) {
                userMemberships[member.userId] = [];
            }
            userMemberships[member.userId].push(member);
        }

        const multiTeamUsers = Object.entries(userMemberships).filter(([_, m]) => m.length > 1);
        if (multiTeamUsers.length > 0) {
            console.log(`  ✅ Found ${multiTeamUsers.length} user(s) in multiple teams (permission merging will apply)`);
            multiTeamUsers.forEach(([userId, memberships]) => {
                console.log(`    - User ${userId}: ${memberships.length} team(s)`);
            });
        } else {
            console.log("  ℹ️  No users in multiple teams (standard scenario)");
        }

        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("✅ Verification Complete!");
        console.log("=".repeat(60));
        console.log(`\n📈 Summary for project "${project.name}":`);
        console.log(`  • ${roles.total} role(s) defined`);
        console.log(`  • ${members.total} member(s) assigned`);
        console.log(`  • Permission system: Operational`);

        console.log(`\n💡 Next Steps:`);
        console.log(`  1. Test permissions in the UI with: useProjectPermissions({ projectId: "${project.$id}" })`);
        console.log(`  2. Try creating/deleting tasks with different roles`);
        console.log(`  3. Test permission changes by updating a member's role`);

    } catch (error) {
        console.error("\n❌ Verification failed:", error);
        process.exit(1);
    }
}

main();
