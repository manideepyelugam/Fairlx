const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

async function checkQueries() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
        .setKey(process.env.NEXT_APPWRITE_KEY);
    const db = new Databases(client);

    const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const PROJECTS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID || 'projects';
    const PROJECT_MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_MEMBERS_ID || 'project_members';
    const PROJECT_TEAMS_ID = 'project_teams'; // Hardcoded in Fairlx
    const PROJECT_TEAM_MEMBERS_ID = 'project_team_members';
    const PROJECT_PERMISSIONS_ID = 'project_permissions';
    const ORGANIZATION_MEMBERS_ID = 'org_members'; // maybe?

    const projectId = "69b450db0028a18b2189";
    const userId = "69b45d6f0039a95df945"; // surendra

    try {
        console.log("Checking project membership...");
        let memberships = await db.listDocuments(DB_ID, PROJECT_MEMBERS_ID, [
            Query.equal("projectId", projectId),
            Query.equal("userId", userId),
            Query.equal("status", "ACTIVE"),
            Query.limit(1)
        ]);
        console.log("Membership total:", memberships.total);

        if (memberships.total === 0) {
            console.log("No ACTIVE member found. Retrieving ALL memberships to check status.");
            memberships = await db.listDocuments(DB_ID, PROJECT_MEMBERS_ID, [
                Query.equal("projectId", projectId),
                Query.equal("userId", userId),
            ]);
            console.log("All memberships:", JSON.stringify(memberships.documents, null, 2));
            return;
        }

        const roleName = memberships.documents[0].roleName;
        console.log("Found ACTIVE roleName:", roleName);

        console.log("Checking team memberships...");
        const teamMemberships = await db.listDocuments(DB_ID, PROJECT_TEAM_MEMBERS_ID, [
            Query.equal("projectId", projectId),
            Query.equal("userId", userId),
        ]);
        console.log("Team memberships:", teamMemberships.total);

        console.log("Checking permissions direct assignment...");
        const directPermissions = await db.listDocuments(DB_ID, PROJECT_PERMISSIONS_ID, [
            Query.equal("projectId", projectId),
            Query.equal("assignedToUserId", userId),
        ]);
        console.log("Direct permissions:", directPermissions.total);

        console.log("ALL QUERIES SUCCESSFUL");

    } catch (err) {
        console.error("APPWRITE ERROR:", err.message);
    }
}
checkQueries();
